const express = require('express');
const router = new express.Router();
const slugify = require('slugify');

const db = require('../db');

router.get('/', async function(req, res, next) {
  /* Performs a query on the database
  to return all companies and then show
   a list of all the companies. It also responds
   with the list of companies 
   
   => {companies: [{code, name}, ...]}
   */

  // try to grab the companies from the db
  try {
    let companiesRes = await db.query(
      `SELECT code, name
      FROM companies
      ORDER BY code, name;`
    );
    res.json({ companies: companiesRes.rows });
    // otherwise return whatever error the server says
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async function(req, res, next) {
  /* Performs a query on the database
  for a specific company code and responds 
  with the details of the company */

  // tries to show the company whose code is entered
  try {
    let code = req.params['code'];
    const companyRes = await db.query(
      `SELECT code, name, description
      FROM companies
      WHERE code = $1;`,
      [code]
    );
    // if query returns no results, then throw an error for doesn't exist
    if (companyRes.rowCount > 0) {
      res.json({ company: companyRes.rows[0] });
    } else {
      let err = new Error("Company code doesn't exist");
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
   company and adds it to the db. Responds with the 
   details of the newly added company */

  try {
    // destructure the req.body
    let { code, name, description } = req.body;

    //if they are all passed from the client, then add company to db
    if (code && name && description) {
      const companyRes = await db.query(
        `INSERT INTO companies
      (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description;`,
        [
          slugify(code, {
            remove: /[*#$%^&_=;?/|><+~.,()'"!:@]/g
          }).toLowerCase(),
          name,
          description
        ]
      );

      return res.json({ company: companyRes.rows[0] });
    } else {
      // if they're missing a param, tell them they need all three
      let err = new Error(
        'Missing parameters. Please input code, name, and description'
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

router.put('/:code', async function(req, res, next) {
  /* Receives data from the PUT request, to update the data 
  of the company in  the database, and responds with that companies
  details */

  try {
    // update the company's name and description
    let code = req.params['code'];
    let { name, description } = req.body;

    const companyRes = await db.query(
      `UPDATE companies
      SET name = $1,
      description = $2
      WHERE code = $3
      RETURNING code, name, description;`,
      [
        name,
        description,
        slugify(code, { remove: /[*#$%^&_=;?/|><+~.,()'"!:@]/g }).toLowerCase()
      ]
    );
    if (companyRes.rows.length === 0) {
      let err = new Error('Incorrect company code');
      err.status = 400;
      return next(err);
    }
    return res.json({ company: companyRes.rows[0] });
    // pass back the error from the server
  } catch (err) {
    next(err);
  }
});

router.delete('/:code', async function(req, res, next) {
  /* Receives a company code from the URL parameter of what 
  company to delete, and proceeds to delete it from the database
  and responds with the JSONified object of "status": "deleted" if 
  successfully deleted-- otherwise returns with an error. */

  // try to delete the company from the db
  try {
    let code = req.params['code'];

    const companyRes = await db.query(
      `DELETE FROM companies
      WHERE code = $1
      RETURNING code`,
      [code]
    );

    if (companyRes.rows.length === 0) {
      let err = new Error('Incorrect company code');
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
