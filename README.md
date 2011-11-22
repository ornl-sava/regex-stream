
hiw-import is a framework for importing csv data into [CouchDB](http://couchdb.apache.org/).

# To run

1. Download and install [node.js](http://nodejs.org/#download), v0.6.x
2. Put data files in csv format in the **data** directory.
3. Ensure you have a running instance of CouchDB that you can connect to from the machine running the import script. If a database for the name you provide does not exist, it will be created.
4. Run the script. You must set the database name, the other parameters are optional, use --help to see all. Use --debug to output informational messages to the console, otherwise, only errors and the totals will be printed to the console.

```
 node import.js --name <database name>
```

# Open Issues

* Node modules are in git, they should be grabbed by [npm](http://npmjs.org/).
* Locale data should be handled better to make sure the info is not already present.
* Need to deal with 'National' level records.