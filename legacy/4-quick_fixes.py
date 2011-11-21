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
    curr_file_out = curr_file_in
    base_name = curr_file_in.rsplit('.')[0]
    if (base_name.endswith('views')):
        continue
    
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
    
    #perform any needed changes, in place

    #change 'HIW_...' to 'CMS_...'
    id = obj['docs'][0]['_id']
    id = 'CMS' + id[3:len(id)]
    obj['docs'][0]['_id'] = id

    #change source from 'HIW' to 'CMS' in metadata
    obj['docs'][0]['metadata']['Source'] = 'CMS'

    #make sure that "Locale State FIPS Code" is a string (currently, is only string if code < 10)
    for item in obj['docs'][0]['data']:
        code = item["Locale State FIPS Code"]
        item["Locale State FIPS Code"] = str(code)
    
    #if it is all one line, some text editors choke on it.
    #also, being human-readable is nice for debugging
    json.dump(obj, codecs.open(curr_file_out, 'w', encoding='utf-8'), ensure_ascii=False, sort_keys=True, indent=4) 

