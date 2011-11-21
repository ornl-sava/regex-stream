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
    curr_file_out = './new/' + base_name + '.json'
    
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
    
    #note: obj['docs'] is a list of dicts, handle accordingly
    new_item = dict()
    new_item.clear()
    print 'old obj: ' 
    print obj
    
    #populate the new object (using the new structure)
    new_item['data'] = obj['docs']
    
    print 'new item: '
    print new_item
    #TODO take metadata obj out of the data obj above.
    for this_data in new_item['data']:
        if ('Metadata' in this_data) and (this_data['Metadata'] == 'True' or this_data['Metadata'] == True): #messy check, but whatever.
            print 'metadata is: '
            print this_data
            new_item['metadata'] = this_data
            new_item['data'].remove(this_data)
    
    base_name = new_item['metadata']["Short Description"]
    #same replacements as makedb.pl
    base_name = base_name.replace('%', 'pct')
    base_name = base_name.replace('#', 'no')
    base_name = base_name.replace(',', '')
    base_name = base_name.replace('.', '')
    base_name = base_name.replace(' ', '_')
    new_item['_id'] = 'HIW_' +base_name
    
    print 'new item is now: '
    print new_item
    
    if debug:
        print obj
    
    new_obj = dict()
    new_obj['docs'] = list()
    new_obj['docs'].append(new_item)
    
    #if it is all one line, some text editors choke on it.
    #also, being human-readable is nice for debugging
    json.dump(new_obj, codecs.open(curr_file_out, 'w', encoding='utf-8'), ensure_ascii=False, sort_keys=True, indent=4) 

