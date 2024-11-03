from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import GPT2Tokenizer, GPT2Model
import torch
import logging

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.DEBUG)

# Load pre-trained model and tokenizer
model_name = "distilgpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2Model.from_pretrained(model_name)

@app.route('/get_attention', methods=['POST'])
def get_attention():
    text = request.json['text']
    app.logger.info(f"Received request with text: {text}")

    # Tokenize input
    inputs = tokenizer(text, return_tensors="pt")
    app.logger.debug(f"Tokenized input: {inputs}")

    # Get model's attention
    with torch.no_grad():
        outputs = model(**inputs, output_attentions=True)

    # Process attention (average over all heads and layers)
    attentions = outputs.attentions
    avg_attention = torch.mean(torch.stack(attentions), dim=(0, 1)).squeeze().tolist()
    app.logger.debug(f"Averaged attention shape: {len(avg_attention)}x{len(avg_attention[0])}")
    app.logger.debug(f"Sample attention values: {avg_attention[0][:5]}")

    # Get token strings
    tokens = tokenizer.convert_ids_to_tokens(inputs['input_ids'][0])
    app.logger.debug(f"Tokens: {tokens}")

    response = {
        'tokens': tokens,
        'attention': avg_attention
    }
    app.logger.info("Sending response")
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)