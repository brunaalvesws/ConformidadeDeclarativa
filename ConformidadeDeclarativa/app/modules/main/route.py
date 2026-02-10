from flask import Blueprint, make_response, jsonify, request
import io
import json
from .controller import MainController
from pathlib import Path
import tempfile
from werkzeug.utils import secure_filename

main_bp = Blueprint('main', __name__)
main_controller = MainController()
@main_bp.route('/', methods=['GET'])
def index():
    result=main_controller.index()
    return make_response(jsonify(result))
  
  
@main_bp.route('/check', methods=['POST'])
def check_conformance():
    declare_model = request.files.get('declare')
    organizational_model = request.files.get('organizational')
    access = request.files.get('access')
    access_log = request.files.get('accessLog')
    event_log = request.files.get('eventLog')
    resource_model = io.StringIO(organizational_model.stream.read().decode("utf-8"))
    access_model = io.StringIO(access.stream.read().decode("utf-8"))
    
    tmp_dir = Path(tempfile.gettempdir())
    tmp_path_acess_log = tmp_dir / secure_filename(access_log.filename)
    access_log.stream.seek(0) 
    access_log.save(tmp_path_acess_log)
    
    tmp_dir = Path(tempfile.gettempdir())
    tmp_path_event_log = tmp_dir / secure_filename(event_log.filename)
    event_log.stream.seek(0) 
    event_log.save(tmp_path_event_log)
    
    tmp_dir = Path(tempfile.gettempdir())
    tmp_path_process_model = tmp_dir / secure_filename(declare_model.filename)
    declare_model.stream.seek(0) 
    declare_model.save(tmp_path_process_model)

    result=main_controller.check(tmp_path_event_log, tmp_path_acess_log, resource_model, tmp_path_process_model, access_model)
    
    return make_response(jsonify(data=result)
    )
      