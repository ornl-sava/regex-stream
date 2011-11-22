
hiw-import is a framework for importing csv data into [CouchDB](http://couchdb.apache.org/).

# To run

1. Download and install [node.js](http://nodejs.org/#download), v0.6.x
2. Put data files in csv format in the **data** directory.
3. Ensure you have a running instance of [CouchDB](http://couchdb.apache.org/) that you can connect to from the machine running the import script.
4. Run the script. You must set the database name, the other parameters are optional, use --help to see all.

```
 node import.js --name <database name>
```

# Open Issues

* Node modules are in git, they should be grabbed by [npm](http://npmjs.org/).
* Locale data should be handled better to make sure the info is not already present.
* Need to deal with 'National' level records.