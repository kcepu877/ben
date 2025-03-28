var d=0;
a = new Array();
  
// ========================================================
function ClearReset() {
  window.document.interfaceform.maxwidth.value = "";
  window.document.interfaceform.inputstring.value = "";
  window.document.interfaceform.permlist.value = "";
  window.document.interfaceform.feedback.value = "";
}

// ========================================================
function GeneratePermutations() {
  var inputstring=window.document.interfaceform.inputstring.value;
  inputstring=removeSpaces(inputstring);
  if (inputstring=="") return;

  var maxoutput=window.document.interfaceform.maxoutput.value;
  maxoutput=removeSpaces(maxoutput);

  var display_list=window.document.interfaceform.chkbx_display.checked;
  var allow_adjacent_equals=window.document.interfaceform.chkbx_allow.checked;
  var wrap_output=window.document.interfaceform.chkbx_wrap.checked;
  var circular_only=window.document.interfaceform.chkbx_circular.checked;
  var derange_only=window.document.interfaceform.chkbx_derange.checked;
  var shuffle=window.document.interfaceform.chkbx_shuffle.checked;

  var maxwidth=window.document.interfaceform.maxwidth.value;
  maxwidth=removeSpaces(maxwidth);

  var comma_separated=window.document.interfaceform.chkbx_comma.checked;

// Show status.
//      This does not work, since Javascript has no way to flush the output during function execution.
//      If you find a SIMPLE way, please let me know?  Thanks - DVdm
//
window.document.interfaceform.permlist.value = "";
if (display_list) {
    window.document.interfaceform.feedback.value = "Generating..."
  } else {
    window.document.interfaceform.feedback.value = "Counting..."
  }

// Get time
//
  var currentDate = new Date();
  var seconds = currentDate.valueOf()
  
// Automatic comma separation check (maybe later)
//
  if ( inputstring.indexOf(',') >-1 ) {
      comma_separated=true;
      window.document.interfaceform.chkbx_comma.checked=true;
  } else {
      comma_separated=false;
      window.document.interfaceform.chkbx_comma.checked=false;
  }

  var delimiter = "";
  if (wrap_output) {
      if (comma_separated)
          delimiter = "  ";
      else
          delimiter = document.getElementById("select1").value
      } else {
          delimiter = "\n";
  }
  var delimwidth = delimiter.length;

  var chars = new Array();
  var charray = new Array();
  var frequency = new Array();
  var inputchar, ii, jj, cc, ccc, numchars, nn=0;

  if (comma_separated) {
      chars = inputstring.split(",");
      numchars = chars.length;
    } else {
    numchars = inputstring.length;
    for (ii=0; ii<numchars; ii++) chars[ii] = inputstring.charAt(ii);
  }

  for (ii=0; ii<numchars; ii++) {
    inputchar = chars[ii];
    cc = -1;
    for (ccc=0; ccc<charray.length; ccc++) { if (inputchar == charray[ccc]) cc = ccc; }
    if (cc<0) {
      charray[charray.length] = inputchar;
      frequency[frequency.length] = 1;
    } else {
      frequency[cc]++;
    }
  }

  d = 0;
  for (ii=0; ii<frequency.length; ii++) {
    cc = frequency[ii];
    for (jj=0; jj<cc; jj++) {
      a[d] = nn;
      d++;
    }
    nn++;
  }

  var perms = 0;
  var output_text = delimiter;
  var new_perm = "";
  var circular = false;
  var test_perm = "";
  var okay = true;
  var firstcomma = -1;
  var busy = true
  var ellipsis = "";
  var atleast = "";
  var insertat = 0;
  var dmax=d;
  if (maxwidth > 0) {
    if (maxwidth <= d) {
      dmax = maxwidth;
    } else {
      window.document.interfaceform.feedback.value = "Max width " + (maxwidth) + " exceeds " + (d) + ".\n";
      return;
    }
  }

  do {
    if ( (allow_adjacent_equals) || (! Adjacent_equals()) ) {
    
      okay = true;
      new_perm = "";
      
      if (comma_separated) {

        for (ii=0; ii<dmax; ii++) {
          new_perm = new_perm + charray[a[ii]];
          if (ii<dmax-1) new_perm = new_perm+",";
        }
        if (maxwidth > 0) {
          if ( output_text.indexOf(new_perm+delimiter) >-1 ) okay = false;    // yes, this is dirty
        }
        if (circular_only) {
          test_perm = new_perm;
          test_perm_len = test_perm.length;
          for (ii=0; ii<dmax-1; ii++) {
            firstcomma = test_perm.indexOf(",");
            test_perm = test_perm.substring(firstcomma+1,test_perm_len) + "," + test_perm.substring(0,firstcomma);
            if ( output_text.indexOf(test_perm) >-1 ) {
              okay = false;
              break;
            }
          }
        }
        if (derange_only) {
          for (ii=0; ii<dmax; ii++) {
            if ( charray[a[ii]] == chars[ii]) {
              okay = false;
              break;
            }
          }
        }

      } else {

        for (ii=0; ii<dmax; ii++) {
          new_perm = new_perm + charray[a[ii]];
        }
        if (maxwidth > 0) {
          if ( output_text.indexOf(new_perm+delimiter) >-1 ) okay = false;    // yes yes, dirty
        }
        if (circular_only) {
          test_perm = new_perm;
          for (ii=0; ii<dmax-1; ii++) {
            test_perm = test_perm.substring(1,dmax) + test_perm.substring(0,1);
            if ( output_text.indexOf(test_perm) >-1 ) okay = false;
          }
        }
        if (derange_only) {
          for (ii=0; ii<dmax; ii++) {
            if ( charray[a[ii]] == chars[ii]) {
              okay = false;
              break;
            }
          }
        }

      }

      if (okay) {
        perms++;
   if (shuffle) {
       insertat = (new_perm.length+delimwidth) * Math.round( ((output_text.length-1)*Math.random())/(new_perm.length+delimwidth) );
       insertat = (output_text).indexOf(delimiter,insertat)+delimwidth;
       if (insertat < delimwidth) insertat = delimwidth;
       output_text = output_text.substring(0,insertat) + new_perm + delimiter + output_text.substring(insertat,output_text.length);
   } else {
       output_text = output_text + new_perm + delimiter;   // even if display_list = false !!!
   }

   if ( display_list && !(maxoutput == "") && (perms >= maxoutput) ) {
       busy = false;
       ellipsis = "..."
       atleast = "at least "
   }
      }
    }
  } while(nextperm() && busy);

  currentDate = new Date();
  seconds = Math.round( ( currentDate.valueOf() - seconds ) / 100 ) / 10;      // round to 1/10 of a second
  window.document.interfaceform.feedback.value = "Jumlah LN: " + atleast + perms + "   -   Waktu: " + seconds + " detik"
  if (display_list) {
    window.document.interfaceform.permlist.value = output_text.substring(delimiter.length) + ellipsis;
  } else {
    window.document.interfaceform.permlist.value = "";
  }
}

// ========================================================
function removeSpaces(string) {
  var tstring = "";
  var i;
  string = '' + string;
  splitstring = string.split(" ");
  for(i = 0; i < splitstring.length; i++)
  tstring += splitstring[i];
  return tstring;
}

// ========================================================
function Adjacent_equals() {
  var ii;
  for (ii=0; ii<d-1; ii++) {
    if (a[ii] == a[ii+1]) return(true);
  }
  return(false);
}

// ========================================================
function nextperm() {
  var i, j, k, swap, s, si;

  for (k=d-2; k>=0; k--) {
    if (a[k] < a[k+1]) {
      s  = a[k+1];
      si = k+1;
      for (i=k+2; i<d; i++) {
        if ((a[i]>a[k])&&(a[i]<s)) {
          s = a[i];
          si = i;
        }
      }
      swap  = a[si];
      a[si] = a[k];
      a[k]  = swap;
      for (i=k+1; i<d-1; i++) {
        for (j=i+1; j<d; j++) {
          if (a[i]>a[j]) {
            swap = a[i];
            a[i] = a[j];
            a[j] = swap;
          }
        }
      }
      return(true);
    }
  }
  return(false);
}

var isArray = function(o) {
   return (o instanceof Array) || (Object.prototype.toString.apply(o) === "[object Array]");
},
combineApp = {
   combinations: function(args) {
      var n, inputArr = [], copyArr = [], results = [],
      subfunc = function(copies, prefix) {
         var i, j, myCopy = [], exprLen, currentChar = "", result = "";
         // if no prefix, set default to empty string
         if (typeof prefix === "undefined") {
            prefix = "";
         }
         // no copies, nothing to do... return
         if (!isArray(copies) || typeof copies[0] === "undefined") {
            return;
         }
         // remove first element from "copies" and store in "myCopy"
         myCopy = copies.splice(0, 1)[0];
         // store the number of characters to loop through
         exprLen = myCopy.length;
         for (i = 0; i < exprLen; i += 1) {
            currentChar = myCopy[i];
            result = prefix + currentChar;
            // if resulting string length is the number of characters of original string, we have a result
            if (result.length === n) {
               results.push(result);
            }
            // if there are copies left,
            //   pass remaining copies (by value) and result (as new prefix) into subfunc (recursively)
            if (typeof copies[0] !== "undefined") {
               subfunc(copies.slice(0), result);
            }
         }
      };
      // for each character in original string
      //   create array (inputArr) which contains original string (converted to array of char)
      if (typeof args.str === "string") {
         inputArr = args.str.split("");
         for (n = 0; n < inputArr.length; n += 1) {
            copyArr.push(inputArr.slice(0));
         }
      }
      if (isArray(args.arr)) {
         for (n = 0; n < args.arr.length; n += 1) {
            copyArr.push(args.arr[n].split(""));
         }
      }
      // pass copyArr into sub-function for recursion
      subfunc(copyArr);
      return results;
   },
   displayMsg: function(msgText, msgID) {
      var msg, nmsg;
      if (typeof msgID === "string" && document && document.getElementById && document.getElementById(msgID)) {
         msg = document.getElementById(msgID);
         nmsg = msg.cloneNode(false);
         msg.parentNode.insertBefore(nmsg, msg);
         msg.parentNode.removeChild(msg);
         nmsg.appendChild(document.createTextNode(msgText));
      } else if (msgText.length > 0) {
         alert(msgText);
      }
   },
   calcCombinations: function(args) {
      if (!args) {
         //args = {};
         return false;
      }
      args.src = (typeof args.src === "object") ? args.src : null;
      args.dest = (typeof args.dest === "object") ? args.dest : null;
      args.msgID = (typeof args.msgID === "string") ? args.msgID : null;
      args.tokenChar = (typeof args.tokenChar === "string") ? ((args.tokenChar.length > 0) ? args.tokenChar : ",") : ",";
      args.outputDelimiter = (typeof args.outputDelimiter === "string") ? args.outputDelimiter : document.getElementById("select2").value;
      args.maxCombinations = (typeof args.maxCombinations === "number") ? parseInt(args.maxCombinations, 10) : 600000;
      
      if (args.src === null || args.dest === null) {
         alert("calcCombinations() required arguments are missing.");
         return false;
      }
      var str = args.src.value, arr = [], objParam = {}, i, numChars, num = 0, doIt = true;
      args.dest.value = "";
      if (str.indexOf(args.tokenChar) !== -1) {
         arr = str.split(args.tokenChar);
         num = 1;
         for (i = 0; i < arr.length; i++) {
            numChars = arr[i].length;
            if (numChars === 0) {
               arr[i] = " ";
            } else {
               num *= numChars;
            }
         }
         str = "[" + arr.join("][") + "]";
         objParam = {"arr": arr};
      } else {
         num = Math.pow(str.length, str.length);
         objParam = {"str": str};
      }
      if (num <= args.maxCombinations && num > 5000) {
         doIt = confirm("This will produce " + num + " combinations. Are you sure you want to continue?");
      }
      if (num > 0) {
         if (num > args.maxCombinations) {
            args.dest.value = "It would take too long for JavaScript to calculate and display all of those combinations of characters.";
         }
         combineApp.displayMsg(num + " LN dari \"" + str + "\".", args.msgID);
         // don't kill the user's CPU using JavaScript to calculate too many combinations
         if (num <= args.maxCombinations && doIt) {
            args.dest.value = combineApp.combinations(objParam).join(args.outputDelimiter);
         }
      }
      return false;
   }
};

function trimSpaces(){
	s = document.getElementById("textString").value;
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi,"");
	s = s.replace(/[ ]{1,}/gi,"");
	s = s.replace(/\n /,"\n");
	document.getElementById("textString").value = s;
}

function getArgs(url) {
   if (typeof url !== "string") {
      url = location.search.substring(1);
   }
   var i, args = new Object(), query = url, pairs = query.split("&"), index;
   for (i = 0; i < pairs.length; i++) {
      index = pairs[i].indexOf("=");
      if (index === -1) continue;
      args[pairs[i].substring(0, index)] = unescape(pairs[i].substring(index + 1).split("+").join(" "));
   }
   return args;
}
function doStuff(str) {
   var f;
   if (document.forms[0] && document.forms[0].str && document.forms[0].txt) {
      f = document.forms[0];
      if (str.length > 0) {
         f.str.value = str;
      }
      combineApp.calcCombinations({
         src: f.str,
         dest: f.txt,
         msgID: "count",
         tokenChar: ",",
         outputDelimiter: "*",
         maxCombinations: 600000
      });
      f.str.focus();
   }
   return false;
}
window.onload = function () {
   var args = getArgs();
   args.str = (typeof args.str !== "undefined") ? args.str.toString() : "";
   doStuff(args.str);
};