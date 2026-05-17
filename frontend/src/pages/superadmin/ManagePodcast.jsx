import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Spinner } from 'react-bootstrap';
import axios from 'axios';
import API_BASE from '../../config/api';

const ManagePodcast = () => {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/podcast`);
      setGuests(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching podcast guests:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`${API_BASE}/api/podcast/${id}/status`, { status });
      fetchGuests();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this registration?')) {
      try {
        await axios.delete(`${API_BASE}/api/podcast/${id}`);
        fetchGuests();
      } catch (err) {
        alert('Failed to delete registration');
      }
    }
  };

  const openDetails = (guest) => {
    setSelectedGuest(guest);
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <Badge bg="success">Approved</Badge>;
      case 'rejected': return <Badge bg="danger">Rejected</Badge>;
      default: return <Badge bg="warning" text="dark">Pending</Badge>;
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-black mb-1">Podcast Guest Management</h2>
          <p className="text-muted small">Review and manage guest requests for the Industrial Times Podcast</p>
        </div>
        <Badge bg="danger" className="p-2 px-3 rounded-pill shadow-sm">
          {guests.filter(g => g.status === 'pending').length} Pending Requests
        </Badge>
      </div>

      <div className="bg-white rounded-4 shadow-sm overflow-hidden border">
        <Table hover responsive className="mb-0">
          <thead className="bg-light">
            <tr>
              <th className="border-0 px-4 py-3 small text-uppercase fw-bold">Guest Name</th>
              <th className="border-0 py-3 small text-uppercase fw-bold">Contact Info</th>
              <th className="border-0 py-3 small text-uppercase fw-bold">Availability</th>
              <th className="border-0 py-3 small text-uppercase fw-bold">Status</th>
              <th className="border-0 px-4 py-3 small text-uppercase fw-bold text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guests.length > 0 ? (
              guests.map((guest) => (
                <tr key={guest.id} className="align-middle">
                  <td className="px-4">
                    <div className="fw-bold">{guest.firstName} {guest.lastName}</div>
                    <div className="x-small text-muted">{guest.website || 'No website'}</div>
                  </td>
                  <td>
                    <div className="small"><i className="bi bi-envelope-fill text-danger me-1"></i> {guest.email}</div>
                    <div className="small"><i className="bi bi-telephone-fill text-muted me-1"></i> {guest.phone}</div>
                  </td>
                  <td className="small fw-bold">
                    {new Date(guest.earliestAvailability).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>{getStatusBadge(guest.status)}</td>
                  <td className="px-4 text-end">
                    <div className="d-flex gap-2 justify-content-end">
                      <Button variant="outline-dark" size="sm" onClick={() => openDetails(guest)}>
                        View Details
                      </Button>
                      {guest.status === 'pending' && (
                        <>
                          <Button variant="success" size="sm" onClick={() => handleStatusUpdate(guest.id, 'approved')}>
                            Approve
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleStatusUpdate(guest.id, 'rejected')}>
                            Reject
                          </Button>
                        </>
                      )}
                      <Button variant="link" className="text-danger p-0 ms-2" onClick={() => handleDelete(guest.id)}>
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-5 text-muted italic">
                  No podcast guest registrations found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* Guest Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-black">Guest Profile Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedGuest && (
            <div className="row g-4">
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Full Name</label>
                <div className="h5 fw-bold">{selectedGuest.firstName} {selectedGuest.lastName}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Email Address</label>
                <div className="h5 fw-bold text-danger">{selectedGuest.email}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Phone Number</label>
                <div className="h6 fw-bold">{selectedGuest.phone}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Website</label>
                <div className="h6 fw-bold">
                  {selectedGuest.website ? (
                    <a href={selectedGuest.website.startsWith('http') ? selectedGuest.website : `https://${selectedGuest.website}`} target="_blank" rel="noreferrer">
                      {selectedGuest.website}
                    </a>
                  ) : 'N/A'}
                </div>
              </div>
              <div className="col-12">
                <label className="text-muted small text-uppercase fw-bold mb-1">Background & Topic Idea</label>
                <div className="p-3 bg-light rounded-3 border lh-lg">
                  {selectedGuest.background}
                </div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Available From</label>
                <div className="h6 fw-bold">{selectedGuest.earliestAvailability}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small text-uppercase fw-bold mb-1">Current Status</label>
                <div>{getStatusBadge(selectedGuest.status)}</div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="dark" onClick={() => setShowModal(false)}>Close Details</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ManagePodcast;
