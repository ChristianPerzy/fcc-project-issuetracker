'use strict';

module.exports = function (app) {
  let idi = 0;
  const projects = {};

  function findIssues(project, filter) {
    let issues = projects[project];
    if (issues === undefined) return [];

    let solution = [];
    let fkeys = Object.keys(filter);

    for (let issue of issues) {
      let add = true;

      for (let key of fkeys) {
        if (issue[key] !== filter[key]) {
          add = false;
          break;
        }
      }

      if (add) solution.push(issue);
    }

    return solution;
  }

  function indexOfId(project, id) {
    let issues = projects[project];
    if (issues === undefined) return -1;
    for (let i = 0; i < issues.length; i++) {
      if (issues[i]['_id'] === id) return i;
    }
    return -1;
  }

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      let project = req.params.project;

      let filter = req.query;
      if (filter['open'] !== undefined) filter['open'] = Boolean(filter['open']);

      let issues = findIssues(project, filter);
      res.json(issues);      
    })
    
    .post(function (req, res){
      let project = req.params.project;

      // build issue
      let date = new Date();

      let issue = {
        _id: (idi++).toString(),
        issue_title: req.body.issue_title || '',
        issue_text: req.body.issue_text || '',
        created_on: date.toISOString(),
        updated_on: date.toISOString(),
        created_by: req.body.created_by || '',
        assigned_to: req.body.assigned_to || '',
        open: true,
        status_text: req.body.status_text || ''
      };

      // check required fields
      if (issue['issue_title'] === '' ||
          issue['issue_text'] === '' ||
          issue['created_by'] == '') {
        res.json({ error: 'required field(s) missing' });
        return;
      }

      // add issue (and project if necessary)
      if (projects[project] === undefined) {
        projects[project] = [];
      }

      projects[project].push(issue);
      res.json(issue);
    })
    
    .put(function (req, res){
      let project = req.params.project;

      // check id
      let id = req.body._id;
      if (id === undefined || id === '') {
        res.json({ error: 'missing _id' });
        return;
      }

      // get what to update
      let toUpdate = {
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to,
        status_text: req.body.status_text,
      };

      for (let key of Object.keys(toUpdate)) {
        if (toUpdate[key] === undefined || toUpdate[key] === '') delete toUpdate[key];
      }
      if (req.body.open === 'false') toUpdate['open'] = false;

      if (Object.keys(toUpdate).length == 0) {
        res.json({ error: 'no update field(s) sent', _id: id });
        return;
      }

      // search issue to update
      let issue = findIssues(project, { _id: id });
      if (issue.length != 1) {
        res.json({ error: 'could not update', _id: id });
        return;
      }
      issue = issue[0];

      // update issue
      for (let key of Object.keys(toUpdate)) {
        issue[key] = toUpdate[key];
      }

      issue['updated_on'] = (new Date()).toISOString();

      res.json({ result: 'successfully updated', _id: id });
    })
    
    .delete(function (req, res){
      let project = req.params.project;

      // check id
      let id = req.body._id;
      if (id === undefined) {
        res.json({ error: 'missing _id' });
        return;
      }

      // find issue id
      let issue_index = indexOfId(project, id);
      if (issue_index < 0) {
        res.json({ error: 'could not delete', _id: id });
        return;
      }

      // delete issue
      projects[project].splice(issue_index,1);

      res.json({ result: 'successfully deleted', _id: id });
    });
    
};
