#this is designed for the HIW data, as converted by Morey's script, but it should also be more generally useful.

import json
import copy
import os
import codecs

debug = False

files = os.listdir('.')

if debug:
    print files

if not os.path.isdir('./new'):
    os.mkdir('./new')

#trim the file list
i = len(files) -1
while i >= 0: #loop backwards, so that items can be removed
    if not files[i].endswith('.json'):
        del files[i]
    elif os.path.isdir(files[i]): #using 'else' so we don't double-delete items that fail both
        del files[i]
    i -= 1

#TODO some fields have various unicode characters in them.  Should we remove/replace these?

for file in files:
    print 'processing file: ' + file

    curr_file_in = file
    base_name = curr_file_in.rsplit('.')[0]
    #otherwise re-running will result in madness!
    if (base_name.endswith('views')):
        continue
    curr_file_out = base_name + '_views' + '.json'
    
    obj_text = codecs.open(curr_file_in, 'r', encoding='utf-8').read()
    #obj_text = open(curr_file_in, 'r').read()
    
    
    #unicode-string now
    #obj_text = obj_text.decode('utf-8') #done above already
    
    if debug:
        print obj_text
    
    obj = json.loads(obj_text)
    
    if debug:
        print obj
        #print obj['docs'][0]['Full Description']
    
    #needed vals from the doc.
    id = obj['docs'][0]['_id']
    
    #print the needed vals obtained above
    #print 'id is: '
    #print id
    
    #make the new doc, which will contain the views.
    new_item = dict()
    new_item['_id'] = '_design/' + id
    new_item['language'] = 'javascript'
    new_item['views'] = dict()
    new_item['views']['info'] = dict()
    new_item['views']['info']['map'] = '\nfunction(doc) {\n  if(doc._id == \"' + id + '\"){\n    emit(\"metadata\", doc.metadata);\n\n    var keys = [];\n      for(var key in doc.data[0]){\n        //client won\'t care about these.\n        if(key != \"_id\" && key != \"_rev\")\n        keys.push(key);\n      }\n    emit(\"data\", keys);\n  }\n}'
    new_item['views']['test'] = dict()
    new_item['views']['test']['map'] = 'function(doc) {\n  if(doc._id == \"' + id + '"){\n    for(var i in doc.data){\n      emit(doc.data[i][\"Locale State FIPS Code\"], doc.data[i]);\n    }\n  }\n}\n'
    new_item['views']['test']['reduce'] = '// this function is taken directly from couchdb source code.\n// thanks, Damien!\n// modified by Mike Iannacone - euf@ornl.gov, mike.iannacone@gmail.com\n\n// Licensed under the Apache License, Version 2.0 (the \"License\"); you may not\n// use this file except in compliance with the License.  You may obtain a copy of\n// the License at\n//\n//   http://www.apache.org/licenses/LICENSE-2.0\n//\n// Unless required by applicable law or agreed to in writing, software\n// distributed under the License is distributed on an \"AS IS\" BASIS, WITHOUT\n// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the\n// License for the specific language governing permissions and limitations under\n// the License.\n\n'
    if 'Float Value' in obj['docs'][0]['data'][0] and len(str(obj['docs'][0]['data'][0]['Float Value'])) > 0:
        new_item['views']['test']['reduce'] += 'function (keys, values, rereduce) {\n  // This computes the standard deviation of the mapped results\n  var stdDeviation=0.0;\n  var count=0;\n  var total=0.0;\n  var sqrTotal=0.0;\n\n  if (!rereduce) {\n    // This is the reduce phase, we are reducing over emitted values from\n    // the map functions.\n    for(var i in values) {\n      total = total + parseFloat(values[i][\"Float Value\"]);\n      sqrTotal = sqrTotal + (parseFloat(values[i][\"Float Value\"]) * parseFloat(values[i][\"Float Value\"]));\n    }\n    count = values.length;\n  }\n  else {\n    // This is the rereduce phase, we are re-reducing previosuly\n    // reduced values.\n    for(var i in values) {\n      count = count + values[i].count;\n      total = total + values[i].total;\n      sqrTotal = sqrTotal + values[i].sqrTotal;\n    }\n  }\n\n  var variance =  (sqrTotal - ((total * total)/count)) / count;\n  stdDeviation = Math.sqrt(variance);\n\n  // the reduce result. It contains enough information to be rereduced\n  // with other reduce results.\n  return {\"stdDeviation\":stdDeviation,\"count\":count,\n  \"total\":total,\"sqrTotal\":sqrTotal,\"average\":total/count};\n};'
    elif 'Integral Value' in obj['docs'][0]['data'][0] and len(str(obj['docs'][0]['data'][0]['Integral Value'])) > 0:
        new_item['views']['test']['reduce'] += 'function (keys, values, rereduce) {\n  // This computes the standard deviation of the mapped results\n  var stdDeviation=0.0;\n  var count=0;\n  var total=0.0;\n  var sqrTotal=0.0;\n\n  if (!rereduce) {\n    // This is the reduce phase, we are reducing over emitted values from\n    // the map functions.\n    for(var i in values) {\n      total = total + parseInt(values[i][\"Integral Value\"]);\n      sqrTotal = sqrTotal + (parseInt(values[i][\"Integral Value\"]) * parseInt(values[i][\"Integral Value\"]));\n    }\n    count = values.length;\n  }\n  else {\n    // This is the rereduce phase, we are re-reducing previosuly\n    // reduced values.\n    for(var i in values) {\n      count = count + values[i].count;\n      total = total + values[i].total;\n      sqrTotal = sqrTotal + values[i].sqrTotal;\n    }\n  }\n\n  var variance =  (sqrTotal - ((total * total)/count)) / count;\n  stdDeviation = Math.sqrt(variance);\n\n  // the reduce result. It contains enough information to be rereduced\n  // with other reduce results.\n  return {\"stdDeviation\":stdDeviation,\"count\":count,\n  \"total\":total,\"sqrTotal\":sqrTotal,\"average\":total/count};\n};'
    else:
        print 'in file ' + id + ' : '
        print obj['docs'][0]['data'][0]
        raise Exception('cant make reduce function, unknown structure.')

    #package the new doc
    new_obj = dict()
    new_obj['docs'] = list()
    new_obj['docs'].append(new_item)
    
    #if it is all one line, some text editors choke on it.
    #also, being human-readable is nice for debugging
    json.dump(new_obj, codecs.open(curr_file_out, 'w', encoding='utf-8'), ensure_ascii=False, sort_keys=True, indent=4) 

