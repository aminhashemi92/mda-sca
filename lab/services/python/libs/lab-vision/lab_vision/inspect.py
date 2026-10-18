from ultralytics import YOLO


def inspect_receipt(weights_path, image_path):
    model = YOLO(weights_path)
    return model.predict(source=image_path, verbose=False)
