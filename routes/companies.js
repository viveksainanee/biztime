const express = require('express');
const router = new express.Router();

const db = require('../db');

router.get('/', async function(req, res, next) {
  try {
    let companies = await db.query(
      `SELECT *
      FROM companies;`
    );
    res.json(companies.rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:code', async function(req, res, next) {
  try {
    let code = req.params['code'];
    const company = await db.query(
      `SELECT *
      FROM companies
      WHERE code = $1;`,
      [code]
    );

    if (company.rowCount > 0) {
      res.json(company.rows[0]);
    } else {
      let err = new Error("Company code doesn't exist");
      err.status = 404;
      return next(err);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/', async function(req, res, next) {
  try {
    // let code = req.body['code'];
    // let name = req.body['name'];
    // let description = req.body['description'];

    let { code, name, description } = req.body;

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
      let err = new Error(
        'Missing parameters. Please input code, name, and description'
      );
      err.status = 400;
      return next(err);
    }
  } catch (err) {
    next(err);
  }
});

router.put('/:code', async function(req, res, next) {
  try {
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
  } catch (err) {
    next(err);
  }
});

router.delete('/:code', async function(req, res, next) {
  try {
    let code = req.params['code'];

    const company = await db.query(
      `DELETE FROM companies
      WHERE code = $1`,
      [code]
    );
    return res.json({ status: 'deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
