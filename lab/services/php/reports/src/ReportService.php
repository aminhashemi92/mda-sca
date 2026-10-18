<?php

namespace Lab\Reports;

use Dompdf\Dompdf;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Request;
use Lab\LegacyHttp\LegacyHttp;
use League\Flysystem\Adapter\Local;
use League\Flysystem\Filesystem;

class ReportService
{
    public function status(string $url): int
    {
        $client = new Client(["timeout" => 2]);
        $response = $client->send(new Request("GET", $url));
        return $response->getStatusCode();
    }

    public function write(string $root, string $name, string $contents): void
    {
        $files = new Filesystem(new Local($root));
        $files->put($name, $contents);
    }

    public function pdf(string $html): string
    {
        $dompdf = new Dompdf();
        $dompdf->loadHtml($html);
        $dompdf->render();
        return $dompdf->output();
    }

    public function path(string $path): string
    {
        $legacy = new LegacyHttp();
        return $legacy->request($path)->getPathInfo();
    }

    public function draft(string $address, string $body): string
    {
        $legacy = new LegacyHttp();
        return $legacy->message($address, $body)->Subject;
    }
}
