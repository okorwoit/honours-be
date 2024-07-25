import sys
from deepforest import main
import numpy as np
from PIL import Image
import json
import os

# Load the pre-trained model
model_checkpoint = 'Backend/ml/deepforest_model/deepforest_model_epoch_49.ckpt'
model = main.deepforest.load_from_checkpoint(model_checkpoint)
model.config['score_thresh'] = 0.3

def predict(image_path):
    image = Image.open(image_path)
    image_array = np.array(image)
    predictions = model.predict_image(image=image_array)
    return predictions

if __name__ == "__main__":
    image_name = sys.argv[1]
    image_path = os.path.join('assets', image_name)
    predictions = predict(image_path)
    print(json.dumps(predictions.to_dict(orient='records')))
