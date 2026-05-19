import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManageEmailSettings = () => {
  const [settings, setSettings] = useState({ adminEmail: '', emailSignature: '' });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, logsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/settings/email`),
        axios.get(`${API_BASE}/api/settings/email-logs`)
      ]);
      setSettings(settingsRes.data);
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Failed to fetch email settings or logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const { data } = await axios.put(`${API_BASE}/api/settings/email`, settings);
      setSettings(data);
      setMessage({ text: 'Settings saved successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (err) {
      setMessage({ text: 'Failed to save settings.', type: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="danger" />
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <div className="mb-4">
        <h2 className="fw-black mb-1">Email System Settings</h2>
        <p className="text-muted small">Configure where notifications are sent and view email history</p>
      </div>

      <Row className="g-4">
        <Col lg={4}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-4 border-bottom pb-2">Configuration</h5>
              
              {message.text && (
                <div className={`alert alert-${message.type} py-2 small`}>{message.text}</div>
              )}

              <Form onSubmit={handleSave}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Admin Notification Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    required 
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
                    className="bg-light border-0"
                  />
                  <Form.Text className="text-muted x-small">
                    New podcast requests and system notifications will be sent here.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted text-uppercase">Email Signature</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    value={settings.emailSignature}
                    onChange={(e) => setSettings({ ...settings, emailSignature: e.target.value })}
                    className="bg-light border-0"
                  />
                  <Form.Text className="text-muted x-small">
                    Appended to replies sent from the dashboard.
                  </Form.Text>
                </Form.Group>

                <Button variant="dark" type="submit" className="w-100 fw-bold" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Form>
              
              <div className="mt-4 pt-4 border-top">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>
                  <span className="fw-bold small">SMTP Server</span>
                </div>
                <p className="text-muted x-small mb-0">
                  SMTP connection details must be configured in the server's environment (.env) file. 
                  Currently using system default.
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card className="border-0 shadow-sm rounded-4 h-100">
            <Card.Body className="p-0">
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Recent Outgoing Emails</h5>
                <Button variant="outline-secondary" size="sm" onClick={fetchData}>
                  <i className="bi bi-arrow-clockwise"></i> Refresh
                </Button>
              </div>
              
              <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <Table hover className="mb-0 align-middle">
                  <thead className="bg-light sticky-top">
                    <tr>
                      <th className="border-0 py-3 px-4 small text-muted text-uppercase">Date/Time</th>
                      <th className="border-0 py-3 small text-muted text-uppercase">Recipient</th>
                      <th className="border-0 py-3 small text-muted text-uppercase">Subject</th>
                      <th className="border-0 py-3 small text-muted text-uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map(log => (
                        <tr key={log.id}>
                          <td className="px-4 small text-muted">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="small fw-medium">{log.toEmail}</td>
                          <td className="small text-truncate" style={{ maxWidth: '200px' }} title={log.subject}>
                            {log.subject}
                          </td>
                          <td>
                            {log.status === 'sent' ? (
                              <Badge bg="success" className="fw-normal"><i className="bi bi-check-circle me-1"></i> Sent</Badge>
                            ) : (
                              <Badge bg="danger" className="fw-normal" title={log.errorMessage}><i className="bi bi-x-circle me-1"></i> Failed</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted small">
                          No email logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ManageEmailSettings;
