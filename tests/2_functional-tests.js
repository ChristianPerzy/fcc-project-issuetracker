const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    test('issue with every field', (done) => {
        const toSend = {
            issue_title: 'title',
            issue_text: 'text',
            created_by: 'me',
            assigned_to: 'also me',
            status_text: '404'
        };

        chai.request(server)
            .post('/api/issues/tests')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(toSend)
            .end((err, res) => {
                assert.equal(res.status, 200);
                const issue = JSON.parse(res.text);
                for (let key of Object.keys(toSend)) {
                    assert.equal(issue[key], toSend[key]);
                }

                assert.exists(issue['_id']);
                assert.isTrue(issue['open']);

                assert.exists(issue['created_on']);
                assert.exists(issue['updated_on']);
                assert.notEqual(new Date(issue['created_on']), 'Invalid Date');
                assert.notEqual(new Date(issue['updated_on']), 'Invalid Date');
                done();
            });
    });

    test('issue with only required fields', (done) => {
        const toSend = {
            issue_title: 'title',
            issue_text: 'text',
            created_by: 'me',
        };

        chai.request(server)
            .post('/api/issues/tests')
            .send(toSend)
            .end((err, res) => {
                assert.equal(res.status, 200);
                const issue = JSON.parse(res.text);
                for (let key of Object.keys(toSend)) {
                    assert.equal(issue[key], toSend[key]);
                }

                assert.exists(issue['_id']);
                assert.isTrue(issue['open']);

                assert.exists(issue['created_on']);
                assert.exists(issue['updated_on']);
                assert.notEqual(new Date(issue['created_on']), 'Invalid Date');
                assert.notEqual(new Date(issue['updated_on']), 'Invalid Date');

                assert.equal(issue['assigned_to'], '');
                assert.equal(issue['status_text'], '');

                done();
            });
    });

    test('issue with missing required fields', (done) => {
        const toSend = {
            issue_title: 'title',
            created_by: 'me',
        };

        chai.request(server)
            .post('/api/issues/tests')
            .send(toSend)
            .end((err, res) => {
                assert.equal(res.status, 200);
                const issue = JSON.parse(res.text);
                assert.deepEqual(issue, { error: 'required field(s) missing' });
                done();
            });
    });

    test('view without filter', (done) => {
        chai.request(server)
            .get('/api/issues/tests')
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.lengthOf(response, 2);
                done();
            });
    });

    test('view with one filter', (done) => {
        chai.request(server)
            .get('/api/issues/tests?_id=1')
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.lengthOf(response, 1);
                done();
            });
    });

    test('view with multiple filters', (done) => {
        chai.request(server)
            .get('/api/issues/tests?created_by=me&issue_title=title')
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.lengthOf(response, 2);
                done();
            });
    });

    test('update one field', (done) => {
        const toUpdate = {
            _id: 0,
            status_text: 'ok'
        };

        chai.request(server)
            .put('/api/issues/tests')
            .send(toUpdate)
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { result: 'successfully updated', _id: 0 });
                done();
            });
    });

    test('update multiple fields', (done) => {
        const toUpdate = {
            _id: 1,
            assigned_to: 'him',
            status_text: 'no change'
        };

        chai.request(server)
            .put('/api/issues/tests')
            .send(toUpdate)
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { result: 'successfully updated', _id: 1 });
                done();
            });
    });

    test('update with missing id', (done) => {
        const toUpdate = {
            status_text: 'IMPORTANT!!!'
        };

        chai.request(server)
            .put('/api/issues/tests')
            .send(toUpdate)
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { error: 'missing _id' });
                done();
            });
    });

    test('update with no fields to update', (done) => {
        const toUpdate = {
            _id: 1,
            open: false
        };

        chai.request(server)
            .put('/api/issues/tests')
            .send(toUpdate)
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { error: 'no update field(s) sent', _id: 1 });
                done();
            });
    });

    test('update with invalid id', (done) => {
        const toUpdate = {
            _id: 1337,
            open: false
        };

        chai.request(server)
            .put('/api/issues/tests')
            .send(toUpdate)
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { error: 'could not update', _id: 1337 });
                done();
            });
    });

    test('delete an issue', (done) => {
        chai.request(server)
            .delete('/api/issues/tests')
            .send({ _id: 0 })
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { result: 'successfully deleted', _id: 0 });
                done();
            });
    });

    test('delete an issue with an invalid id', (done) => {
        chai.request(server)
            .delete('/api/issues/tests')
            .send({ _id: 1337 })
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { error: 'could not delete', _id: 1337 });
                done();
            });
    });

    test('delete an issue with an missing id', (done) => {
        chai.request(server)
            .delete('/api/issues/tests')
            .send({})
            .end((err, res) => {
                assert.equal(res.status, 200);
                let response = JSON.parse(res.text);
                assert.deepEqual(response, { error: 'missing _id' });
                done();
            });
    });
});
