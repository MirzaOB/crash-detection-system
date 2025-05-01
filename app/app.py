from flask import Flask, render_template, request, jsonify
import os
import datetime

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/log_crash', methods=['POST'])
def log_crash():
    data = request.json
    x = data.get('x', 0)
    y = data.get('y', 0)
    z = data.get('z', 0)
    total = data.get('total', 0)
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"{timestamp} - Crash detected! X: {x:.2f}, Y: {y:.2f}, Z: {z:.2f}, Total: {total:.2f} m/s²\n"
    
    with open('crash_log.txt', 'a') as f:
        f.write(log_entry)
    
    return jsonify({"status": "success", "message": "Crash logged"})

if __name__ == '__main__':
    # Check if crash_log.txt exists, if not create it
    if not os.path.exists('crash_log.txt'):
        with open('crash_log.txt', 'w') as f:
            f.write("Crash Detection Log\n")
            f.write("-----------------\n")
    
    # Run the Flask app in debug mode (use HTTP for local testing)
    app.run(debug=True, host='0.0.0.0', port=5000)