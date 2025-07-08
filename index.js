const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ✅ Use Render's PORT if available
const port = process.env.PORT || 3000;

// ✅ Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// OData-like query
app.get('/odata/flights', async (req, res) => {
  try {
    let query = supabase.from('flights').select('*');

    if (req.query['$filter']) {
      const filter = req.query['$filter'];
      const [column, , value] = filter.split(' ');
      const val = value.replace(/'/g, '');
      query = query.eq(column, val);
    }

    if (req.query['$top']) {
      query = query.limit(parseInt(req.query['$top']));
    }

    if (req.query['$skip']) {
      query = query.range(
        parseInt(req.query['$skip']),
        parseInt(req.query['$skip']) + (req.query['$top'] ? parseInt(req.query['$top']) - 1 : 9)
      );
    }

    if (req.query['$orderby']) {
      const [col, order] = req.query['$orderby'].split(' ');
      query = query.order(col, { ascending: order !== 'desc' });
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error });

    res.json({
      '@odata.context': req.protocol + '://' + req.get('host') + '/odata/$metadata',
      value: data
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// Metadata
app.get('/odata/$metadata', (req, res) => {
  res.type('application/xml');
  res.send(YOUR XML METADATA HERE); // Keep the same metadata block
});

// Start the server
app.listen(port, () => {
  console.log(OData server running at http://localhost:${port}/odata/flights);
});
