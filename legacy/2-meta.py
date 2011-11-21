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
    curr_file_out = curr_file_in.rsplit('.')[0] #only needed if we want a suffix again
    curr_file_out = './new/' + curr_file_out + '.json'
    
    obj_text = codecs.open(curr_file_in, 'r', encoding='utf-8').read()
    #obj_text = open(curr_file_in, 'r').read()
    
    #these files have a trailing comma after the last item in the array.  
    #the earlier script will leave it there, but python's json lib chokes on that.
    obj_text = obj_text.rsplit(',', 1)
    if (len(obj_text[1]) < 10 ):
        obj_text = obj_text[0] + obj_text[1]
    #else, it looks like that comma was in-between some real items, so put it back in.
    #shouldn't happen, but may be true for different versions, or if json file is from different source.
    else: 
        obj_text = obj_text[0] + ',' + obj_text[1]
    
    #unicode-string now
    #obj_text = obj_text.decode('utf-8') #done above already
    
    if debug:
        print obj_text
    
    obj = json.loads(obj_text)
    
    if debug:
        print obj
        #print obj['docs'][0]['Full Description']
    
    #note: obj['docs'] is a list of dicts, handle accordingly
    
    #find all dupe fields (this will include always-blank fields)
    meta_item = copy.deepcopy(obj['docs'][0])
    meta_keys = meta_item.viewkeys()
    
    for item in obj['docs']:
        i = len(meta_keys)-1
        while i >= 0: #looping backwards again
            field = list(meta_keys)[i]
            i -= 1
            if item[field] != meta_item[field]:
                del meta_item[field]
        
    if debug:
        print "!!!!!!!!!!! initial meta_item is this: !!!!!!!!!!!"
        print meta_item
    
    #for any values that you specifically DONT want in the metadata, remove them here.
    #this will mean that they are left in with the data
    #year, etc.
    if 'Year' in meta_item:
        del meta_item['Year']
    if 'Confidence Interval Low' in meta_item:
        del meta_item['Confidence Interval Low']
    if 'Confidence Interval High' in meta_item:
        del meta_item['Confidence Interval High']
    if 'Standard Error' in meta_item:
        del meta_item['Standard Error']
# data val can have a few diff names, no need to keep the blank ones.
#    if 'Float Value' in meta_item:
#        del meta_item['Float Value']
#    if 'Integral Value' in meta_item:
#        del meta_item['Integral Value']
    if 'Locale' in meta_item:
        del meta_item['Locale']
    
    #remove anything from data that is also in metadta
    for field in meta_keys:
        for item in obj['docs']:
             del item[field]
    
    #remove blank fields from the metadata object.  we dont really want them.
    i = len(meta_keys)-1
    while i >= 0: #loop backwards again
        field = list(meta_keys)[i]
        i -= 1
        #basestring will match both 'str' and 'unicode' types
        if isinstance(meta_item[field], basestring) and len(meta_item[field]) == 0:
            del meta_item[field]
    
    #insert any special fields into the metadata
    #ex source:HIW, etc.
    meta_item['Source'] = 'HIW'
    meta_item['Metadata'] = 'True' #prob not the best way to flag this, meh.
    
    #insert the metadata doc into the main object
    obj['docs'].append(meta_item)
    
    if debug:
        print obj
    
    #if it is all one line, some text editors choke on it.
    #also, being human-readable is nice for debugging
    json.dump(obj, codecs.open(curr_file_out, 'w', encoding='utf-8'), ensure_ascii=False, sort_keys=True, indent=4) 

