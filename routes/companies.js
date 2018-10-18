const express = require('express');
const router = new express.Router();

const db = require('../db');

router.get('/', async function(req, res, next) {
  // try to grab the companies from the db
  try {
    let companies = await db.query(
      `SELECT *
      FROM companies;`
    );
    res.json(companies.rows);
    // otherwise return whatever error the server says
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async function(req, res, next) {
  // tries to show the company whose code is entered
  try {
    let code = req.params['code'];
    const company = await db.query(
      `SELECT *
      FROM companies
      WHERE code = $1;`,
      [code]
    );
    // if query returns no results, then throw an error for doesn't exist
    if (company.rowCount > 0) {
      res.json(company.rows[0]);
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
  try {
    // destructure the req.body
    let { code, name, description } = req.body;

    //if they are all passed from the client, then add company to db
    if (code && name && description) {
      const company = await db.query(
        `INSERT INTO companies
      (code, name, description)
      VALUES ($1, $2, $3)
      RETURNING code, name, description;`,
        [code, name, description]
      );

      return res.json(company);
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
  try {
    // update the company's name and description
    let code = req.params['code'];
    let { name, description } = req.body;

    const company = await db.query(
      `UPDATE companies
      SET name = $1,
      description = $2
      WHERE code = $3
      RETURNING code, name, description;`,
      [name, description, code]
    );
    return res.json({ company });
    // pass back the error from the server
  } catch (err) {
    next(err);
  }
});

router.delete('/:code', async function(req, res, next) {
  // try to delete the company from the db
  try {
    let code = req.params['code'];

    const company = await db.query(
      `DELETE FROM companies
      WHERE code = $1`,
      [code]
    );
    return res.json({ status: 'deleted' });
    // pass back the error from the server
  } catch (err) {
    next(err);
  }
});

module.exports = router;
