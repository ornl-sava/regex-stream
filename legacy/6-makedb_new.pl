#!/usr/bin/perl

#################################################################
#
# Make CouchDB databases from doc loadfiles
#################################################################

use Getopt::Std;            # command line options processing
use POSIX qw(strftime);
use File::Basename;
use Cwd;
use JSON::PP;

my $dbname = "health_data_test";
#my $dbname = "health_data";
#my $dbname = "recline"; #to test out how recline works with real data.
@files = <*>;
my $cnt = 0;
my $cwd = cwd();
foreach $file (@files)
{ if($file !~ /\.json/) { next; }
  $cnt++;
  my $docname = $file;
  $docname =~ s/\.json//g;
  $docname =~ s/#/no/g;
  $docname =~ s/[\.,]//g;
  $docname =~ s/ /_/g;
  $docname = lc $docname;
  print "docname=$docname, file=$file\n";
#  system "curl --user euf:garbagepass -X PUT http://127.0.0.1:5984/$docname";
  system "curl --user euf:garbagepass -X POST http://127.0.0.1:5984/$dbname/_bulk_docs -H \"Content-type: application/json\" -d @" . "\"$cwd/$file\"";
# if($cnt > 2) { exit;}
} 
print "$cnt databases loaded\n";

