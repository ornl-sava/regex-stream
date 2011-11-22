
hiw-import is a framework for importing csv data into [CouchDB](http://couchdb.apache.org/).

# To run

1. Download and install [node.js](http://nodejs.org/#download), v0.6.x
2. Put data files in csv format in the **data** directory.
3. Ensure you have a running instance of CouchDB that you can connect to from the machine running the import script.

    node import.js -n <couchdb database>

For more options, such as changing the CouchDB database location.

    node import.js --help


# Open Issues

* Node modules are in git, they should be grabbed by [npm](http://npmjs.org/).
* Locale data should be handled better to make sure the info is not already present.
* Need to deal with 'National' level records.