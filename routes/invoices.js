const express = require('express');
const router = new express.Router();

const db = require('../db');

router.get('/', async function(req, res, next) {
  /* Performs a query on the database
  to return all invoices and then show
   a list of all the invoices. It also responds
   with the list of invoices 
   
   => {invoices: [{id, comp_code}, ...]}
   */

  // try to grab the invoices from the db
  try {
    let invoicesRes = await db.query(
      `SELECT id, comp_code
      FROM invoices;`
    );
    res.json({ invoices: invoicesRes.rows });
    // otherwise return whatever error the server says
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async function(req, res, next) {
  /* Performs a query on the database
  for a specific invoices id and responds
  with the details of the invoices 
  
  => {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}
  
  */

  // tries to show the invoices whose id is entered
  try {
    let id = req.params['id'];
    const invoicesRes = await db.query(
      `SELECT id, amt, paid, add_date, paid_date, comp_code
      FROM invoices
      WHERE id = $1;`,
      [id]
    );
    if (invoicesRes.rowCount > 0) {
      const { amt, paid, add_date, paid_date } = invoicesRes.rows[0];

      const comp_codeRes = invoicesRes.rows[0].comp_code;

      const companyRes = await db.query(
        `SELECT code, name, description
      FROM companies
      WHERE code = $1;`,
        [comp_codeRes]
      );

      const { code, name, description } = companyRes.rows[0];

      const superData = {
        amt,
        paid,
        add_date,
        paid_date,
        company: { code, name, description }
      };

      // if query returns no results, then throw an error for doesn't exist

      res.json({ invoice: superData });
    } else {
      let err = new Error("invoice id doesn't exist");
      err.status = 404;
      return next(err);
    }
    // return the error that gets passed from the server
  } catch (err) {
    next(err);
  }
});

router.post('/', async function(req, res, next) {
  /* Gets data from the POST request, to create a
   invoice and adds it to the db. Responds with the
   details of the newly added invoice 
   
   => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

   */

  try {
    // destructure the req.body
    let { comp_code, amt } = req.body;

    //if they are all passed from the client, then add invoice to db
    if (comp_code && amt) {
      const invoiceRes = await db.query(
        `INSERT INTO invoices
      (comp_code, amt)
      VALUES ($1, $2)
      RETURNING comp_code, amt;`,
        [comp_code, amt]
      );

      return res.json({ invoice: invoiceRes.rows[0] });
    } else {
      // if they're missing a param, tell them they need all three
      let err = new Error(
        'Missing parameters. Please input comp_code and amount'
      );
      // Serve the user a Bad Request message
      err.status = 400;
      return next(err);
    }
    //return error from server
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async function(req, res, next) {
  /* Receives data from the PUT request, to update the data
  of the invoice in  the database, and responds with that invoice's
  details 

  => {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

*/

  try {
    // update the invoice's name and description
    let id = req.params['id'];
    let { amt, paid } = req.body;
    let invoiceRes;

    if (paid === false) {
      invoiceRes = await db.query(
        `UPDATE invoices
        SET amt = $1
        WHERE id = $2
        RETURNING id, comp_code, amt, paid, add_date, paid_date;`,
        [amt, id]
      );
    } else {
      invoiceRes = await db.query(
        `UPDATE invoices
        SET amt = $1,
        paid_date = CURRENT_DATE,
        paid = $2
        WHERE id = $3
        RETURNING id, comp_code, amt, paid, add_date, paid_date;`,
        [amt, paid, id]
      );
    }

    if (invoiceRes.rows.length === 0) {
      let err = new Error('Incorrect invoice id');
      err.status = 404;
      return next(err);
    }
    return res.json({ invoice: invoiceRes.rows[0] });
    // pass back the error from the server
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async function(req, res, next) {
  /* Receives a invoice id from the URL parameter of what
  invoice to delete, and proceeds to delete it from the database
  and responds with the JSONified object of "status": "deleted" if
  successfully deleted-- otherwise returns with an error. */

  // try to delete the invoice from the db
  try {
    let id = req.params['id'];

    const invoiceRes = await db.query(
      `DELETE FROM invoices
      WHERE id = $1
      RETURNING id`,
      [id]
    );

    if (invoiceRes.rows.length === 0) {
      let err = new Error('Incorrect invoice id');
      err.status = 400;
      return next(err);
    }

    return res.json({ status: 'deleted' });
    // pass back the error from the server
  } catch (err) {
    next(err);
  }
});

module.exports = router;
