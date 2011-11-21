#!/usr/bin/perl

#################################################################
#
# CMS Project csv to json parser/generator - mnp - September 2011
#
#################################################################

use Getopt::Std;            # command line options processing
use POSIX qw(strftime);
use File::Basename;
use JSON::PP;
#use Text::CSV;       # currently not used
#use Text::CSV_XS;    # currently not used
#use Test::JSON;      # currently not used

my $opt_string = '?cdhl:n:p';    # command line options
getopts( "$opt_string", \my %opt ) or usage() and exit;
if($opt{"?"}) { usage(); }
$File = $ARGV[0];
$Now = strftime "%Y%m%d", localtime;

my $json = JSON::PP->new->utf8; # create json object

$Line=0;
#$/ = "\r\n"; #default line-sep
$/ = "\n"; #default line-sep
my $line_sep = $opt{l};
if(defined $line_sep) { $line_sep =~ s/\\r/\r/g; $line_sep =~ s/\\n/\n/g; $/=$line_sep;}
open(IN,"$File") || die "?$0:cannot open '$File'\n";
# treat file as binary so we can handle different line-separators
binmode(IN);

my $hdr_str = <IN>; # header expected as first line
chomp $hdr_str;
# headers as an array of [1]...[#]
my(@hdrary) = split(/,/,$hdr_str);
unshift @hdrary,undef;

if($opt{"h"}) { listHeader(@hdrary); }

# command-line key-value
my @keyvalary = @ARGV;
shift @keyvalary;

my $line_to_print = ($opt{n} ? $opt{n} : undef);

if($opt{"d"}) { print "{\n\"docs\":[\n"; }

# main loop
while($buf = <IN>)
{
  chomp $buf;
  $Line++;
  $buf =~ s/\n//g;
  my $outstr ="";
  $outstr .="{";
# print "$buf\n";
  
# value array as [1]...[#]
  my @valary = parse_csv($buf);
  unshift @valary,undef; #shift right by 1
  
  if(scalar @valary != scalar @hdrary)
  {
    print "Unmatched number of headers (",scalar @hdrary, ") and values (", scalar @valary, ") on line $Line\n";
    exit 1;
  }

  # quote non-numberics vals
  for(my $i = 1; $i < @valary; $i++)
  {
     if(! isNumber($valary[$i]))
     {
       #print "valary[$i]=$valary[$i]\n";
       if($valary[$i] !~ /^".*$"/) 
       { $valary[$i] ="\"$valary[$i]\"";
       }
     }
  }

  if(scalar @keyvalary > 0)
  { for(my $i = 0; $i < @keyvalary; $i++)
    { my $str = $keyvalary[$i];
      $str =~ s/h(\d+)/"$hdrary[$1]"/gi;
      $str =~ s/v(\d+)/$valary[$1]/gi;
      $outstr .= $str . ",";
    }
  }
  else
  { for(my $i = 1; $i < @hdrary; $i++)
    {  $outstr .= "\"$hdrary[$i]\":$valary[$i],";
    }
  }
  $outstr =~ s/,$//g;  # strip off last "," if any
  $outstr .= "}";
# print "==>$outstr\n";

  # #validate json
  $perl_scalar = $json->decode( $outstr );
  if($opt{"p"}) { $outstr = $json->pretty->encode( $perl_scalar ); }

  # limit output (-n)
  if(defined $line_to_print && $Line > $line_to_print) { last; }

  if($opt{"d"}) { $outstr .= ","; }
  if($opt{"c"}) { next;}
  print "$outstr\n";
}
if($opt{"d"}) { print "]\n}"; }

sub parse_csv
###############################################################################
# courtesey of Jeffrey Friedl
###############################################################################
{ my $text = shift; ## record containing comma-separated values
  my @new = ();
  push(@new, $+) while $text =~ m{
    ## the first part groups the phrase inside the quotes
    "([^\"\\]*(?:\\.[^\"\\]*)*)",?
      | ([^,]+),?
      | ,
    }gx;
    push(@new, undef) if substr($text, -1,1) eq ',';
    return @new; ## list of values that were comma-spearated
}

sub isNumber
###############################################################################
#
###############################################################################
{ 
  my ($no) = @_;

# if($no =~ /^(\+|-)?((\d+(\.\d+)?)|(\.\d+))$/) { return 1; }
  if($no !~ /^0/ && $no =~ /^(\+|-)?((\d+(\.\d+)?)|(\.\d+))$/) { return 1; }
  return undef; 
}

sub listHeader()
###############################################################################
# List Header
###############################################################################
{
 my $hdr_str = @_;
 for($i = 1; $i < @hdrary; $i++) { print "h",($i),":$hdrary[$i]\n";}
 exit;
}

sub usage()
###############################################################################
# 
###############################################################################
{
  print STDOUT << "EOF";

Generate and output JSON object-lines from a CSV file.

Usage: $0 [-?dhnp] csv_file [JSON key-value-pair...]

key-value pairs are one or more JSON component specification in <key:value> format, where <key> is a
label-string -- typically a CSV-file header column (specified by the reserved letter 'h' followed by
a valid header column-number in 'h#' format. For example, 'h3' is the third header column. the <value>
parameter specifies one or more CSV-file value column(s) indicated by the reserved letter 'v' followed
by a valid column number as in "v#". For example, v8 is the 8th value column in the CSV file.

Options:
     -?            : this (help) message
     -c            : check (validate) csv file and JSON structure
     -d            : dump (print) output for CouchDB bulk-load
     -h            : list headers only
     -l[separator] : line terminator (default is "\\r\\n")
     -n count      : print the first n lines
     -p            : pretty print

Examples:

      $0 -h myfile.csv

      Lists all the CSV file headers


      $0 myfile.csv

      Outputs all the CSV file's header-values as JSON key-value pairs.
      (this is equivalent to $0 myfile.csv h1:v1 h2:v2 ... h#:v#)


      $0 -p myfile.csv h1:v1 h2:[v2,v3]

      Outputs two JSON key-value pairs consisting of: (1) column1-header and column1-value and
      (2) column2-header as an array of column2-value and column3-value

      $0 -d myfile.csv > loadme.json

      Outputs all the CSV file's JSON key-value pairs in the CouchDB bulk-load-ready format. 
      To load the output file in a CouchDB database, say database 'mydb', use:

      shell> curl -X POST http://127.0.0.1:5984/mydb/_bulk_docs -H "Content-type: application/json" -d \@loadme.json
EOF
  exit 0;
}

sub version() 
###############################################################################
# 
###############################################################################
{
  print "version $VERSION\n";
  exit 0;
}
