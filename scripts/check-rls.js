var https = require('https');
var key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVramV5cmpiaHdudXF6bnVrbXprIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwMDkyMCwiZXhwIjoyMDk1ODc2OTIwfQ.yw3tlCFOlbhK2wrusYXl9JPLO5U_ZAESGe_5CD0PYhk';

// Check by getting a call log with service_role
var body = JSON.stringify({ query: "SELECT schemaname, tablename, policyname, cmd, qual FROM pg_policies WHERE tablename IN ('call_logs','transcriptions','feedback','conversations','callback_requests') ORDER BY tablename" });

// Use the sql query parameter
var path = '/rest/v1/pg_policies?select=schemaname,tablename,policyname,cmd,qual,roles&tablename=in.("call_logs","transcriptions","feedback","conversations","callback_requests")&order=tablename';

var req = https.request({
  method: 'GET',
  hostname: 'ukjeyrjbhwnuqznukmzk.supabase.co',
  path: path,
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key,
    'Accept': 'application/json'
  }
}, function(res) {
  var d = '';
  res.on('data', function(c) { d += c; });
  res.on('end', function() {
    try {
      var j = JSON.parse(d);
      j.forEach(function(r) {
        console.log(r.tablename + ' | ' + r.policyname + ' | cmd=' + r.cmd + ' | roles=' + JSON.stringify(r.roles));
      });
    } catch(e) {
      console.log('Status:', res.statusCode, d.substring(0, 500));
    }
  });
});
req.on('error', function(e) { console.error(e.message); });
req.end();
