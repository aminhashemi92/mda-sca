import asyncio

import aiohttp
import colorama
import yaml
from cryptography.fernet import Fernet
from ctx import ctx as app_ctx
from django.http import JsonResponse
from flask import Flask
from git import Repo
from jinja2 import Environment
from lxml import etree
from PIL import Image
from requests import Session
from werkzeug.utils import secure_filename
import idna
import urllib3

from lab_vision import inspect_receipt

CONFIG = "currency: IRR\nchannel: pos\n"
ORDER_XML = "<order id='1001'/>"
TEMPLATE = "order {{ order_id }}"


def read_config(text=CONFIG):
    return yaml.load(text, Loader=yaml.FullLoader)


def fetch_status(url):
    session = Session()
    response = session.get(url, timeout=2)
    return response.status_code


def pool_status(url):
    pool = urllib3.PoolManager()
    response = pool.request("GET", url, timeout=2.0)
    return response.status


def host_label(host):
    return idna.encode(host).decode("ascii")


def image_size(path):
    with Image.open(path) as image:
        return image.size


def order_tag(xml_bytes=ORDER_XML.encode("utf-8")):
    root = etree.fromstring(xml_bytes)
    return root.tag


def head_commit(path):
    repo = Repo(path)
    return repo.head.commit.hexsha


async def remote_status(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return response.status


def seal(payload):
    key = Fernet.generate_key()
    token = Fernet(key).encrypt(payload.encode("utf-8"))
    return token.decode("ascii")


def render_title(order_id):
    environment = Environment(autoescape=True)
    template = environment.from_string(TEMPLATE)
    return template.render(order_id=order_id)


def safe_upload_name(filename):
    return secure_filename(filename)


def flask_app():
    application = Flask("lab-ingest")

    @application.get("/health")
    def health():
        return JsonResponse({"service": "ingest", "paint": colorama.Fore.GREEN})

    return application


def remember_tenant(tenant_id):
    app_ctx.tenant = tenant_id
    return app_ctx.tenant


def prepare_order(url, image_path, weights_path, repo_path):
    config = read_config()
    title = render_title(config.get("channel", "pos"))
    filename = safe_upload_name("receipt 1001.png")
    predictions = inspect_receipt(weights_path, image_path)
    status = asyncio.run(remote_status(url))
    return {
        "config": config,
        "title": title,
        "filename": filename,
        "http": fetch_status(url),
        "pool": pool_status(url),
        "host": host_label("example.invalid"),
        "image": image_size(image_path),
        "tag": order_tag(),
        "commit": head_commit(repo_path),
        "status": status,
        "sealed": seal(title),
        "tenant": remember_tenant("northwind"),
        "color": colorama.Style.RESET_ALL,
        "predictions": len(list(predictions or [])),
    }
