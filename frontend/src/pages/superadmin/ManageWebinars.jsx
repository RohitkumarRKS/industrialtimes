import React, { useState, useEffect, useRef } from 'react';
import { Container, Table, Button, Badge, Modal, Form, Spinner, Row, Col, Tabs, Tab, Card, ProgressBar } from 'react-bootstrap';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import API_BASE from '../../config/api';

const slugify = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const ManageWebinars = () => {
  const [webinars, setWebinars] = useState([]);
  const [registrants, setRegistrants] = useState([]);
  const [selectedWebinarId, setSelectedWebinarId] = useState('');
  const [loadingWebinars, setLoadingWebinars] = useState(true);
  const [loadingRegistrants, setLoadingRegistrants] = useState(false);

  // Modals state
  const [showWebinarModal, setShowWebinarModal] = useState(false);
  const [selectedWebinar, setSelectedWebinar] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBlastModal, setShowBlastModal] = useState(false);
  const [blastData, setBlastData] = useState({ subject: '', message: '' });
  const [sendingBlast, setSendingBlast] = useState(false);

  // Recorded Video modal state
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [addVideoForm, setAddVideoForm] = useState({
    title: '',
    speaker: '',
    description: '',
    videoUrl: ''
  });
  const [addVideoMode, setAddVideoMode] = useState('link'); // 'link' or 'upload'

  // Platform settings state
  const [webinarIsEnabledSetting, setWebinarIsEnabledSetting] = useState(true);
  const [webinarGstRateSetting, setWebinarGstRateSetting] = useState(18);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Form fields for create/edit webinar
  const [webinarForm, setWebinarForm] = useState({
    title: '',
    description: '',
    speaker: '',
    dateTime: '',
    dateTimeEnd: '',
    schedule: [{ dayNumber: 1, date: '', startTime: '', duration: 45 }],
    videoUrl: '',
    paymentButtonText: 'Pay Registration Fee',
    paymentLink: '',
    isPaymentEnabled: true,
    entryFee: 99,
    meetingLink: '',
    whatsAppGroupLink: '',
    isActive: true
  });
  const [savingWebinar, setSavingWebinar] = useState(false);
  const [videoUploadMode, setVideoUploadMode] = useState('link'); // 'link' or 'upload'
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const videoFileRef = useRef(null);

  // States for Dedicated Recording Video Upload Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [recordForm, setRecordForm] = useState({ videoUrl: '' });
  const [recordModalMode, setRecordModalMode] = useState('link'); // 'link' or 'upload'
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const recordFileRef = useRef(null);

  const getHeaders = () => {
    try {
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || localStorage.getItem('userInfo'));
      return adminInfo?.token ? { headers: { Authorization: `Bearer ${adminInfo.token}` } } : {};
    } catch (e) {
      return {};
    }
  };

  const fetchWebinars = async () => {
    try {
      setLoadingWebinars(true);
      const { data } = await axios.get(`${API_BASE}/api/webinars`);
      setWebinars(data || []);
      if (data && data.length > 0 && !selectedWebinarId) {
        setSelectedWebinarId(data[0].id.toString());
      }
    } catch (err) {
      console.error('Error fetching webinars:', err);
    } finally {
      setLoadingWebinars(false);
    }
  };

  const fetchRegistrants = async (webinarId) => {
    if (!webinarId) return;
    try {
      setLoadingRegistrants(true);
      const { data } = await axios.get(`${API_BASE}/api/webinars/${webinarId}/registrants`, getHeaders());
      setRegistrants(data || []);
    } catch (err) {
      console.error('Error fetching registrants:', err);
    } finally {
      setLoadingRegistrants(false);
    }
  };

  const fetchPlatformSettings = async () => {
    try {
      setLoadingSettings(true);
      const { data } = await axios.get(`${API_BASE}/api/platform-settings`, getHeaders());
      if (data && data.settings) {
        setWebinarIsEnabledSetting(data.settings.webinar_is_enabled?.value === 'true');
        setWebinarGstRateSetting(Number(data.settings.webinar_gst_rate?.value || 18));
      }
    } catch (err) {
      console.error('Error fetching platform settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchWebinars();
    fetchPlatformSettings();
  }, []);

  useEffect(() => {
    if (selectedWebinarId) {
      fetchRegistrants(selectedWebinarId);
    }
  }, [selectedWebinarId]);

  const handleOpenAddWebinar = () => {
    setSelectedWebinar(null);
    setWebinarForm({
      title: '',
      description: '',
      speaker: '',
      dateTime: '',
      dateTimeEnd: '',
      schedule: [{ dayNumber: 1, date: '', startTime: '', duration: 45 }],
      videoUrl: '',
      paymentButtonText: 'Pay Registration Fee',
      paymentLink: '',
      isPaymentEnabled: true,
      entryFee: 99,
      meetingLink: '',
      whatsAppGroupLink: '',
      isActive: true
    });
    setShowWebinarModal(true);
  };

  const handleOpenEditWebinar = (webinar) => {
    setSelectedWebinar(webinar);
    // Format dateTime for datetime-local input (YYYY-MM-DDThh:mm)
    let formattedDate = '';
    if (webinar.dateTime) {
      const dt = new Date(webinar.dateTime);
      const tzOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
      formattedDate = localISOTime;
    }
    
    let formattedDateEnd = '';
    if (webinar.dateTimeEnd) {
      const dt = new Date(webinar.dateTimeEnd);
      const tzOffset = dt.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16);
      formattedDateEnd = localISOTime;
    }

    let parsedSchedule = [];
    if (webinar.schedule) {
      try {
        parsedSchedule = typeof webinar.schedule === 'string' ? JSON.parse(webinar.schedule) : webinar.schedule;
      } catch (e) {
        parsedSchedule = [];
      }
    }
    if (!Array.isArray(parsedSchedule) || parsedSchedule.length === 0) {
      // Fallback Day 1 based on existing dateTime
      if (webinar.dateTime) {
        const dt = new Date(webinar.dateTime);
        const tzOffset = dt.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString();
        const datePart = localISOTime.split('T')[0];
        const timePart = localISOTime.split('T')[1].slice(0, 5);
        parsedSchedule = [{ dayNumber: 1, date: datePart, startTime: timePart, duration: 45 }];
      } else {
        parsedSchedule = [{ dayNumber: 1, date: '', startTime: '', duration: 45 }];
      }
    }

    setWebinarForm({
      title: webinar.title || '',
      description: webinar.description || '',
      speaker: webinar.speaker || '',
      dateTime: formattedDate,
      dateTimeEnd: formattedDateEnd,
      schedule: parsedSchedule,
      videoUrl: webinar.videoUrl || '',
      paymentButtonText: webinar.paymentButtonText || 'Pay Registration Fee',
      paymentLink: webinar.paymentLink || '',
      isPaymentEnabled: webinar.isPaymentEnabled !== undefined ? webinar.isPaymentEnabled : true,
      entryFee: webinar.entryFee !== undefined ? webinar.entryFee : 99,
      meetingLink: webinar.meetingLink || '',
      whatsAppGroupLink: webinar.whatsAppGroupLink || '',
      isActive: webinar.isActive !== undefined ? webinar.isActive : true
    });
    setShowWebinarModal(true);
    setVideoUploadMode(webinar.videoUrl && !webinar.videoUrl.includes('youtube') && !webinar.videoUrl.includes('youtu.be') && webinar.videoUrl.includes('/uploads/') ? 'upload' : 'link');
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const { data } = await axios.post(`${API_BASE}/api/upload/video`, formData, {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setVideoUploadProgress(pct);
        }
      });
      setWebinarForm(prev => ({ ...prev, videoUrl: data.videoUrl }));
      setVideoUploadProgress(100);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload video. Max size: 500MB.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveWebinar = async (e) => {
    e.preventDefault();
    setSavingWebinar(true);
    try {
      const schedule = webinarForm.schedule || [];
      if (schedule.length === 0) {
        alert('Please add at least one day to the schedule.');
        setSavingWebinar(false);
        return;
      }

      const firstDay = schedule[0];
      if (!firstDay.date || !firstDay.startTime) {
        alert('Please select a date and start time for Day 1.');
        setSavingWebinar(false);
        return;
      }

      const primaryDateTime = new Date(`${firstDay.date}T${firstDay.startTime}`).toISOString();

      const payload = {
        ...webinarForm,
        dateTime: primaryDateTime,
        dateTimeEnd: null,
        schedule: JSON.stringify(schedule)
      };

      if (selectedWebinar) {
        // Edit mode
        await axios.put(`${API_BASE}/api/webinars/${selectedWebinar.id}`, payload, getHeaders());
      } else {
        // Create mode
        await axios.post(`${API_BASE}/api/webinars`, payload, getHeaders());
      }
      setShowWebinarModal(false);
      fetchWebinars();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save webinar settings');
    } finally {
      setSavingWebinar(false);
    }
  };

  const handleOpenAddVideo = () => {
    setAddVideoForm({
      title: '',
      speaker: '',
      description: '',
      videoUrl: ''
    });
    setAddVideoMode('link');
    setShowAddVideoModal(true);
  };

  const handleVideoModalUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const { data } = await axios.post(`${API_BASE}/api/upload/video`, formData, {
        ...getHeaders(),
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setVideoUploadProgress(pct);
        }
      });
      setAddVideoForm(prev => ({ ...prev, videoUrl: data.videoUrl }));
      setVideoUploadProgress(100);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload video. Max size: 500MB.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveAddVideo = async (e) => {
    e.preventDefault();
    setSavingWebinar(true);
    try {
      const payload = {
        title: addVideoForm.title,
        description: addVideoForm.description,
        speaker: addVideoForm.speaker,
        dateTime: new Date().toISOString(),
        dateTimeEnd: null,
        schedule: '[]',
        videoUrl: addVideoForm.videoUrl,
        isPaymentEnabled: false,
        entryFee: 0,
        meetingLink: '',
        whatsAppGroupLink: '',
        isActive: false,
        isRecordedVideo: true
      };

      await axios.post(`${API_BASE}/api/webinars`, payload, getHeaders());
      setShowAddVideoModal(false);
      fetchWebinars();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save recorded video.');
    } finally {
      setSavingWebinar(false);
    }
  };


  const handleOpenRecordModal = (webinar) => {
    setSelectedWebinar(webinar);
    setRecordForm({ videoUrl: webinar.videoUrl || '' });
    setRecordModalMode(webinar.videoUrl && !webinar.videoUrl.includes('youtube') && !webinar.videoUrl.includes('youtu.be') && webinar.videoUrl.includes('/uploads/') ? 'upload' : 'link');
    setRecordProgress(0);
    setShowRecordModal(true);
  };

  const handleRecordVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingRecord(true);
    setRecordProgress(0);
    try {
       const formData = new FormData();
       formData.append('video', file);
       const { data } = await axios.post(`${API_BASE}/api/upload/video`, formData, {
         ...getHeaders(),
         headers: {
           ...getHeaders().headers,
           'Content-Type': 'multipart/form-data'
         },
         onUploadProgress: (progressEvent) => {
           const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
           setRecordProgress(pct);
         }
       });
       setRecordForm(prev => ({ ...prev, videoUrl: data.videoUrl }));
       setRecordProgress(100);
    } catch (err) {
       alert(err.response?.data?.message || 'Failed to upload video. Max size: 500MB.');
    } finally {
       setUploadingRecord(false);
    }
  };

  const handleSaveRecordVideo = async (e) => {
    e.preventDefault();
    setSavingWebinar(true);
    try {
      await axios.put(`${API_BASE}/api/webinars/${selectedWebinar.id}`, { videoUrl: recordForm.videoUrl }, getHeaders());
      setShowRecordModal(false);
      fetchWebinars();
    } catch (err) {
      alert('Failed to save webinar recording.');
    } finally {
      setSavingWebinar(false);
    }
  };

  const handleDeleteWebinar = async (id) => {
    if (window.confirm('Are you sure you want to delete this webinar? This will also remove any related registrants.')) {
      try {
        await axios.delete(`${API_BASE}/api/webinars/${id}`, getHeaders());
        fetchWebinars();
      } catch (err) {
        alert('Failed to delete webinar.');
      }
    }
  };

  const handleTogglePaymentStatus = async (reg) => {
    const nextStatus = reg.paymentStatus === 'completed' ? 'pending' : 'completed';
    try {
      await axios.put(`${API_BASE}/api/webinars/registrants/${reg.id}`, { paymentStatus: nextStatus }, getHeaders());
      fetchRegistrants(selectedWebinarId);
    } catch (err) {
      alert('Failed to update payment status.');
    }
  };

  const handleOpenShare = (webinar) => {
    setSelectedWebinar(webinar);
    setCopied(false);
    setShowShareModal(true);
  };

  const handleCopyLink = () => {
    const webinarUrl = `${window.location.origin}/webinar/${slugify(selectedWebinar.title)}`;
    navigator.clipboard.writeText(webinarUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('webinar-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `webinar_${selectedWebinar.id}_qr.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleSendBlast = async (e) => {
    e.preventDefault();
    setSendingBlast(true);
    try {
      await axios.post(`${API_BASE}/api/webinars/${selectedWebinarId}/email-blast`, blastData, getHeaders());
      alert('Email notification blast sent to all registrants successfully!');
      setShowBlastModal(false);
      setBlastData({ subject: '', message: '' });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to dispatch email blast.');
    } finally {
      setSendingBlast(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await axios.put(`${API_BASE}/api/platform-settings`, {
        settings: {
          webinar_is_enabled: webinarIsEnabledSetting ? 'true' : 'false',
          webinar_gst_rate: String(webinarGstRateSetting)
        }
      }, getHeaders());
      alert('Webinar platform settings updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save webinar platform settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <Container className="py-3">
      <Card className="border-0 shadow-sm rounded-4 overflow-hidden mb-4">
        <div style={{ height: '5px', backgroundColor: '#da251d' }}></div>
        <Card.Body className="p-4">
          <Tabs defaultActiveKey="webinars" className="mb-4 custom-dashboard-tabs">
            
            {/* TAB 1: Webinars Setup */}
            <Tab eventKey="webinars" title={<span><i className="bi bi-broadcast me-2"></i>Webinars Setup</span>}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Platform Webinars</h4>
                <Button 
                  onClick={handleOpenAddWebinar} 
                  className="rounded-pill fw-bold btn-danger px-4 py-2" 
                  style={{ backgroundColor: '#da251d', border: 'none' }}
                >
                  <i className="bi bi-plus-circle-fill me-2"></i> Add New Webinar
                </Button>
              </div>

              {loadingWebinars ? (
                <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
              ) : webinars.filter(w => !w.isRecordedVideo).length === 0 ? (
                <div className="text-center py-5 bg-light rounded border"><p className="text-muted mb-0">No webinars added yet.</p></div>
              ) : (
                <Table responsive hover className="align-middle border-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Title</th>
                      <th>Speaker</th>
                      <th>Date & Time</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webinars.filter(w => !w.isRecordedVideo).map(webinar => (
                      <tr key={webinar.id}>
                        <td><span className="fw-bold">{webinar.title}</span></td>
                        <td>{webinar.speaker || 'N/A'}</td>
                        <td>
                          {(() => {
                            let sched = [];
                            if (webinar.schedule) {
                              try {
                                sched = typeof webinar.schedule === 'string' ? JSON.parse(webinar.schedule) : webinar.schedule;
                              } catch (e) {}
                            }
                            if (Array.isArray(sched) && sched.length > 0) {
                              return (
                                <div className="d-flex flex-column gap-1">
                                  {sched.map((day, idx) => {
                                    let formattedTime = day.startTime;
                                    try {
                                      const [hour, minute] = day.startTime.split(':');
                                      const dateObj = new Date();
                                      dateObj.setHours(parseInt(hour), parseInt(minute));
                                      formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
                                    } catch (err) {}
                                    
                                    return (
                                      <div key={idx} className="small text-nowrap">
                                        <strong>Day {day.dayNumber}:</strong> {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {formattedTime} ({day.duration} mins)
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }
                            return new Date(webinar.dateTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
                          })()}
                        </td>
                        <td>
                          {webinar.isPaymentEnabled ? (
                            <Badge bg="danger" className="px-2 py-1.5 text-uppercase">Paid (₹{webinar.entryFee !== undefined ? webinar.entryFee : 99})</Badge>
                          ) : (
                            <Badge bg="success" className="px-2 py-1.5 text-uppercase">Free</Badge>
                          )}
                        </td>
                        <td>
                          {webinar.isActive ? (
                            <Badge bg="success" className="px-2 py-1.5">Active</Badge>
                          ) : (
                            <Badge bg="secondary" className="px-2 py-1.5">Inactive</Badge>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <Button variant="outline-dark" size="sm" onClick={() => handleOpenShare(webinar)} title="Get Link & QR">
                              <i className="bi bi-share"></i>
                            </Button>
                            <Button variant="outline-success" size="sm" onClick={() => handleOpenRecordModal(webinar)} title="Add/Edit Recording Video">
                              <i className="bi bi-film"></i>
                            </Button>
                            <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditWebinar(webinar)} title="Edit Webinar">
                              <i className="bi bi-pencil-square"></i>
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteWebinar(webinar.id)} title="Delete Webinar">
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            {/* TAB 2: Registrants Management */}
            <Tab eventKey="registrants" title={<span><i className="bi bi-people-fill me-2"></i>Registrants & Payments</span>}>
              <Row className="mb-4 g-3 align-items-end">
                <Col md={6}>
                  <Form.Group controlId="selectWebinar">
                    <Form.Label className="fw-bold small text-muted">Select Webinar to View Registrants</Form.Label>
                    <Form.Select 
                      value={selectedWebinarId} 
                      onChange={(e) => setSelectedWebinarId(e.target.value)}
                      className="py-2"
                    >
                      <option value="">-- Choose Webinar --</option>
                      {webinars.map(w => (
                        <option key={w.id} value={w.id}>{w.title} ({w.speaker})</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6} className="text-md-end">
                  <Button 
                    disabled={!selectedWebinarId || registrants.length === 0} 
                    onClick={() => {
                      setBlastData({ subject: '', message: '' });
                      setShowBlastModal(true);
                    }}
                    className="btn-danger rounded-pill fw-bold px-4 py-2"
                    style={{ backgroundColor: '#da251d', border: 'none' }}
                  >
                    <i className="bi bi-envelope-paper-fill me-2"></i> Send Email Blast / Zoom Link
                  </Button>
                </Col>
              </Row>

              {loadingRegistrants ? (
                <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
              ) : !selectedWebinarId ? (
                <div className="text-center py-5 bg-light rounded"><p className="text-muted mb-0">Select a webinar to manage registrants.</p></div>
              ) : registrants.length === 0 ? (
                <div className="text-center py-5 bg-light rounded"><p className="text-muted mb-0">No users registered for this webinar yet.</p></div>
              ) : (
                <Table responsive hover className="align-middle border-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Contact Details</th>
                      <th>Company & Designation</th>
                      <th>Transaction ID</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registrants.map(reg => (
                      <tr key={reg.id}>
                        <td><span className="fw-bold">{reg.name}</span></td>
                        <td>
                          <div className="small text-muted"><i className="bi bi-envelope me-1"></i> {reg.email}</div>
                          <div className="small text-muted"><i className="bi bi-telephone me-1"></i> {reg.phone}</div>
                        </td>
                        <td>
                          <div>{reg.company || 'N/A'}</div>
                          <div className="small text-muted">{reg.designation || 'N/A'}</div>
                        </td>
                        <td>
                          {reg.transactionId ? (
                            <code className="text-dark bg-light px-2 py-1 rounded small">{reg.transactionId}</code>
                          ) : (
                            <span className="text-muted small">None</span>
                          )}
                        </td>
                        <td>
                          <Button 
                            variant={reg.paymentStatus === 'completed' ? 'success' : 'warning'} 
                            size="sm" 
                            className="rounded-pill px-3 py-1 fw-bold text-uppercase"
                            onClick={() => handleTogglePaymentStatus(reg)}
                            style={{ fontSize: '0.65rem' }}
                          >
                            {reg.paymentStatus === 'completed' ? 'Completed' : 'Pending Verification'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

            {/* TAB 3: Webinar Settings */}
            <Tab eventKey="settings" title={<span><i className="bi bi-gear-fill me-2"></i>Webinar Settings</span>}>
              <h5 className="fw-bold mb-4">Webinar Platform Configurations</h5>
              {loadingSettings ? (
                <div className="text-center py-5"><Spinner animation="border" variant="danger" /></div>
              ) : (
                <Form onSubmit={handleSaveSettings} style={{ maxWidth: '600px' }}>
                  <Card className="bg-light border-0 p-4 rounded-4 mb-4">
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-bold text-dark mb-1 d-block">Webinar Feature Module</Form.Label>
                      <Form.Check 
                        type="switch"
                        id="webinarIsEnabled"
                        label={webinarIsEnabledSetting ? "Webinars Module is Enabled (Link shown in navigation menu)" : "Webinars Module is Disabled (Link hidden from navigation menu)"}
                        checked={webinarIsEnabledSetting}
                        onChange={e => setWebinarIsEnabledSetting(e.target.checked)}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label className="fw-bold text-dark">Webinar Payment GST Rate (%)</Form.Label>
                      <Form.Control 
                        type="number"
                        min="0"
                        max="100"
                        value={webinarGstRateSetting}
                        onChange={e => setWebinarGstRateSetting(Number(e.target.value))}
                        required
                        placeholder=""
                      />
                      <Form.Text className="text-muted">
                        Specify the GST percentage rate included inside the webinar entrance/registration fees.
                      </Form.Text>
                    </Form.Group>
                  </Card>

                  <Button 
                    type="submit" 
                    disabled={savingSettings}
                    className="btn btn-danger px-5 py-2.5 rounded-pill fw-bold shadow-sm"
                    style={{ backgroundColor: '#da251d', border: 'none' }}
                  >
                    {savingSettings ? <Spinner animation="border" size="sm" /> : 'Save Configurations'}
                  </Button>
                </Form>
              )}
            </Tab>

            {/* TAB 4: Webinar Recordings */}
            <Tab eventKey="recordings" title={<span><i className="bi bi-film me-2"></i>Webinar Recordings</span>}>
              <Row className="g-4">
                <Col lg={6}>
                  <Card className="bg-light border-0 p-4 rounded-4">
                    <h5 className="fw-bold mb-3"><i className="bi bi-cloud-upload me-2 text-danger"></i>Upload Webinar Recording</h5>
                    <Form onSubmit={handleSaveRecordVideo}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-bold small text-muted">Select Webinar</Form.Label>
                        <Form.Select 
                          value={selectedWebinar?.id || ''} 
                          onChange={(e) => {
                            const selected = webinars.find(w => w.id.toString() === e.target.value);
                            setSelectedWebinar(selected || null);
                            setRecordForm({ videoUrl: selected?.videoUrl || '' });
                          }}
                          required
                          className="py-2"
                        >
                          <option value="">-- Choose Webinar --</option>
                          {webinars.map(w => (
                            <option key={w.id} value={w.id}>{w.title}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
 
                      {selectedWebinar && (
                        <>
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-bold small text-muted">Upload Video or Paste Link</Form.Label>
                            <div className="d-flex gap-2 mb-3">
                              <Button
                                type="button"
                                variant={recordModalMode === 'link' ? 'danger' : 'outline-secondary'}
                                size="sm"
                                className="rounded-pill px-3 fw-bold"
                                style={recordModalMode === 'link' ? { backgroundColor: '#da251d', border: 'none' } : {}}
                                onClick={() => setRecordModalMode('link')}
                              >
                                <i className="bi bi-link-45deg me-1"></i> Paste Recording Link
                              </Button>
                              <Button
                                type="button"
                                variant={recordModalMode === 'upload' ? 'danger' : 'outline-secondary'}
                                size="sm"
                                className="rounded-pill px-3 fw-bold"
                                style={recordModalMode === 'upload' ? { backgroundColor: '#da251d', border: 'none' } : {}}
                                onClick={() => setRecordModalMode('upload')}
                              >
                                <i className="bi bi-cloud-upload me-1"></i> Upload Recording File
                              </Button>
                            </div>
 
                            {recordModalMode === 'link' ? (
                              <Form.Control
                                type="text"
                                value={recordForm.videoUrl}
                                onChange={e => setRecordForm({...recordForm, videoUrl: e.target.value})}
                                placeholder=""
                              />
                            ) : (
                              <div>
                                <Form.Control
                                  type="file"
                                  accept="video/*"
                                  ref={recordFileRef}
                                  onChange={handleRecordVideoUpload}
                                  disabled={uploadingRecord}
                                  className="mb-2"
                                />
                                {uploadingRecord && (
                                  <ProgressBar
                                    now={recordProgress}
                                    label={`${recordProgress}%`}
                                    variant="danger"
                                    animated
                                    className="mb-2"
                                    style={{ height: '8px' }}
                                  />
                                )}
                                {recordForm.videoUrl && recordForm.videoUrl.includes('/uploads/') && (
                                  <div className="d-flex align-items-center gap-2 mt-1">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span className="small text-muted">Video uploaded successfully: <code>{recordForm.videoUrl}</code></span>
                                  </div>
                                )}
                              </div>
                            )}
                            <Form.Text className="text-muted">
                              Provide the recording of this webinar. It will show up on the past webinars or recorded video section on the website.
                            </Form.Text>
                          </Form.Group>
 
                          <Button 
                            type="submit" 
                            disabled={savingWebinar || uploadingRecord}
                            className="btn btn-danger px-4 py-2 rounded-pill fw-bold shadow-sm"
                            style={{ backgroundColor: '#da251d', border: 'none' }}
                          >
                            {savingWebinar ? <Spinner animation="border" size="sm" /> : 'Save Recording'}
                          </Button>
                        </>
                      )}
                    </Form>
                  </Card>
                </Col>
 
                <Col lg={6}>
                  <Card className="border-0 shadow-sm rounded-4 p-4">
                    <h5 className="fw-bold mb-3"><i className="bi bi-collection-play me-2 text-danger"></i>Uploaded Recordings</h5>
                    {webinars.filter(w => w.videoUrl && w.videoUrl.trim() !== '').length === 0 ? (
                      <div className="text-center py-5 bg-light rounded"><p className="text-muted mb-0">No webinar recordings uploaded yet.</p></div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {webinars.filter(w => w.videoUrl && w.videoUrl.trim() !== '').map(w => (
                          <div key={w.id} className="p-3 bg-light rounded border d-flex justify-content-between align-items-center">
                            <div>
                              <span className="fw-bold d-block">{w.title}</span>
                              <span className="small text-muted d-block">Speaker: {w.speaker || 'N/A'}</span>
                              <a href={w.videoUrl} target="_blank" rel="noopener noreferrer" className="small text-danger text-decoration-none">
                                <i className="bi bi-play-circle-fill me-1"></i> View Video Source
                              </a>
                            </div>
                            <Button 
                              variant="outline-danger" 
                              size="sm"
                              className="rounded-circle"
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to remove the recording for "${w.title}"?`)) {
                                  try {
                                    await axios.put(`${API_BASE}/api/webinars/${w.id}`, { videoUrl: '' }, getHeaders());
                                    fetchWebinars();
                                  } catch (err) {
                                    alert('Failed to remove recording.');
                                  }
                                }
                              }}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </Tab>

            {/* TAB 5: Recorded Videos Uploaded directly */}
            <Tab eventKey="recorded_videos" title={<span><i className="bi bi-film me-2"></i>Recorded Videos</span>}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Recorded Videos / Past Uploads</h4>
                <Button 
                  onClick={handleOpenAddVideo} 
                  className="rounded-pill fw-bold btn-success px-4 py-2" 
                  style={{ backgroundColor: '#198754', border: 'none' }}
                >
                  <i className="bi bi-cloud-arrow-up-fill me-2"></i> Add Recorded Video
                </Button>
              </div>

              {loadingWebinars ? (
                <div className="text-center py-5"><Spinner animation="border" variant="success" /></div>
              ) : webinars.filter(w => w.isRecordedVideo).length === 0 ? (
                <div className="text-center py-5 bg-light rounded border"><p className="text-muted mb-0">No recorded videos uploaded yet.</p></div>
              ) : (
                <Table responsive hover className="align-middle border-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Title</th>
                      <th>Speaker / Presenter</th>
                      <th>Video Source</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webinars.filter(w => w.isRecordedVideo).map(video => (
                      <tr key={video.id}>
                        <td><span className="fw-bold">{video.title}</span></td>
                        <td>{video.speaker || 'N/A'}</td>
                        <td>
                          <a href={video.videoUrl.startsWith('http') ? video.videoUrl : `${API_BASE}${video.videoUrl}`} target="_blank" rel="noopener noreferrer" className="small text-danger text-decoration-none">
                            <i className="bi bi-play-circle-fill me-1"></i> {video.videoUrl.startsWith('http') ? 'YouTube/External' : 'Local Upload'}
                          </a>
                        </td>
                        <td className="text-end">
                          <Button variant="outline-danger" size="sm" onClick={() => handleDeleteWebinar(video.id)} title="Delete Video">
                            <i className="bi bi-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Tab>

          </Tabs>
        </Card.Body>
      </Card>

      {/* Webinar Form Modal */}
      <Modal show={showWebinarModal} onHide={() => !savingWebinar && setShowWebinarModal(false)} centered size="lg">
        <Modal.Header closeButton={!savingWebinar} className="bg-dark text-white border-0 p-4">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
            <i className="bi bi-broadcast text-danger me-2"></i> {selectedWebinar ? 'Edit Webinar Settings' : 'Create New Webinar'}
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-4 p-md-5">
          <Form onSubmit={handleSaveWebinar}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group controlId="webinarTitle">
                  <Form.Label className="fw-bold small text-muted">Webinar Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    value={webinarForm.title} 
                    onChange={e => setWebinarForm({...webinarForm, title: e.target.value})} 
                    required 
                    placeholder=""
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="webinarSpeaker">
                  <Form.Label className="fw-bold small text-muted">Presenter / Speaker Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={webinarForm.speaker} 
                    onChange={e => setWebinarForm({...webinarForm, speaker: e.target.value})} 
                    placeholder=""
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <div className="border rounded-3 p-3 bg-light mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <Form.Label className="fw-bold text-dark mb-0">Webinar Days & Schedule <span className="text-danger">*</span></Form.Label>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => {
                        const newDays = [...(webinarForm.schedule || [])];
                        newDays.push({ dayNumber: newDays.length + 1, date: '', startTime: '', duration: 45 });
                        setWebinarForm({ ...webinarForm, schedule: newDays });
                      }}
                      className="rounded-pill px-3 py-1 fw-bold"
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Day
                    </Button>
                  </div>
                  
                  {(webinarForm.schedule || []).map((day, idx) => (
                    <Row key={idx} className="g-2 align-items-end mb-3 pb-3" style={{ borderBottom: idx < webinarForm.schedule.length - 1 ? '1px dashed #dee2e6' : 'none' }}>
                      <Col xs={12} md={2}>
                        <Form.Label className="fw-bold small text-muted">Day Label</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={`Day ${day.dayNumber}`} 
                          disabled
                          className="bg-white"
                        />
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Label className="fw-bold small text-muted">Date <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="date" 
                          value={day.date} 
                          onChange={(e) => {
                            const newDays = [...webinarForm.schedule];
                            newDays[idx].date = e.target.value;
                            setWebinarForm({ ...webinarForm, schedule: newDays });
                          }}
                          required
                        />
                      </Col>
                      <Col xs={12} md={3}>
                        <Form.Label className="fw-bold small text-muted">Start Time <span className="text-danger">*</span></Form.Label>
                        <Form.Control 
                          type="time" 
                          value={day.startTime} 
                          onChange={(e) => {
                            const newDays = [...webinarForm.schedule];
                            newDays[idx].startTime = e.target.value;
                            setWebinarForm({ ...webinarForm, schedule: newDays });
                          }}
                          required
                        />
                      </Col>
                      <Col xs={12} md={2}>
                        <Form.Label className="fw-bold small text-muted">Duration (Mins)</Form.Label>
                        <Form.Control 
                          type="number" 
                          min="1"
                          value={day.duration} 
                          onChange={(e) => {
                            const newDays = [...webinarForm.schedule];
                            newDays[idx].duration = parseInt(e.target.value) || 0;
                            setWebinarForm({ ...webinarForm, schedule: newDays });
                          }}
                          required
                        />
                      </Col>
                      <Col xs={12} md={1} className="text-center">
                        {webinarForm.schedule.length > 1 && (
                          <Button 
                            variant="outline-danger" 
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              let newDays = webinarForm.schedule.filter((_, i) => i !== idx);
                              newDays = newDays.map((d, i) => ({ ...d, dayNumber: i + 1 }));
                              setWebinarForm({ ...webinarForm, schedule: newDays });
                            }}
                            title="Remove Day"
                          >
                            <i className="bi bi-trash"></i>
                          </Button>
                        )}
                      </Col>
                    </Row>
                  ))}
                </div>
              </Col>

              <Col md={12}>
                <Form.Group controlId="webinarDesc">
                  <Form.Label className="fw-bold small text-muted">Detailed Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    value={webinarForm.description} 
                    onChange={e => setWebinarForm({...webinarForm, description: e.target.value})} 
                    placeholder=""
                  />
                </Form.Group>
              </Col>



              {/* Payment toggle block */}
              <Col md={12}>
                <Card className="bg-light p-3 border-0 rounded-3 my-2">
                  <Form.Check 
                    type="switch"
                    id="isPaymentEnabled"
                    label={<strong className="text-dark">Require Registration Payment</strong>}
                    checked={webinarForm.isPaymentEnabled}
                    onChange={e => setWebinarForm({...webinarForm, isPaymentEnabled: e.target.checked})}
                    className="mb-3"
                  />

                  {webinarForm.isPaymentEnabled && (
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group controlId="entryFee">
                          <Form.Label className="fw-bold small text-muted">Entry Fee (₹) <span className="text-danger">*</span></Form.Label>
                          <Form.Control 
                            type="number"
                            min="0"
                            step="any"
                            value={webinarForm.entryFee} 
                            onChange={e => setWebinarForm({...webinarForm, entryFee: Number(e.target.value)})} 
                            required
                            placeholder=""
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="payBtnText">
                          <Form.Label className="fw-bold small text-muted">Payment Button Text</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={webinarForm.paymentButtonText} 
                            onChange={e => setWebinarForm({...webinarForm, paymentButtonText: e.target.value})} 
                            placeholder=""
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="payLink">
                          <Form.Label className="fw-bold small text-muted">Payment Link Override (Optional)</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={webinarForm.paymentLink} 
                            onChange={e => setWebinarForm({...webinarForm, paymentLink: e.target.value})} 
                            placeholder=""
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  )}
                </Card>
              </Col>

              <Col md={12}>
                <Form.Group controlId="webinarMeetingLink">
                  <Form.Label className="fw-bold small text-muted">Default Meeting Credentials Link (Sent automatically on payment completion)</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={webinarForm.meetingLink} 
                    onChange={e => setWebinarForm({...webinarForm, meetingLink: e.target.value})} 
                    placeholder=""
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="webinarWhatsAppLink">
                  <Form.Label className="fw-bold small text-muted">WhatsApp Group / Community Link</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={webinarForm.whatsAppGroupLink} 
                    onChange={e => setWebinarForm({...webinarForm, whatsAppGroupLink: e.target.value})} 
                    placeholder="e.g. https://chat.whatsapp.com/..."
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Check 
                  type="switch"
                  id="isActive"
                  label={<strong className="text-dark">Webinar Active / Publish Now</strong>}
                  checked={webinarForm.isActive}
                  onChange={e => setWebinarForm({...webinarForm, isActive: e.target.checked})}
                  className="mt-2"
                />
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowWebinarModal(false)}
                disabled={savingWebinar}
                className="px-4 py-2 rounded-pill fw-bold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={savingWebinar}
                className="btn btn-danger px-4 py-2 rounded-pill fw-bold shadow-sm"
                style={{ backgroundColor: '#da251d', border: 'none' }}
              >
                {savingWebinar ? <Spinner animation="border" size="sm" /> : 'Save Webinar'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Add Recorded Video Modal */}
      <Modal show={showAddVideoModal} onHide={() => !savingWebinar && setShowAddVideoModal(false)} centered size="lg">
        <Modal.Header closeButton={!savingWebinar} className="bg-dark text-white border-0 p-4">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
            <i className="bi bi-film text-success me-2"></i> Add Recorded Video / Past Webinar
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="p-4 p-md-5">
          <Form onSubmit={handleSaveAddVideo}>
            <Row className="g-3">
              <Col md={12}>
                <Form.Group controlId="addVideoTitle">
                  <Form.Label className="fw-bold small text-muted">Video Title <span className="text-danger">*</span></Form.Label>
                  <Form.Control 
                    type="text" 
                    value={addVideoForm.title} 
                    onChange={e => setAddVideoForm({...addVideoForm, title: e.target.value})} 
                    required 
                    placeholder="e.g. Industrial Automation Seminar"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="addVideoSpeaker">
                  <Form.Label className="fw-bold small text-muted">Presenter / Speaker Name</Form.Label>
                  <Form.Control 
                    type="text" 
                    value={addVideoForm.speaker} 
                    onChange={e => setAddVideoForm({...addVideoForm, speaker: e.target.value})} 
                    placeholder="e.g. Mr. John Doe"
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="addVideoDesc">
                  <Form.Label className="fw-bold small text-muted">Video Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4} 
                    value={addVideoForm.description} 
                    onChange={e => setAddVideoForm({...addVideoForm, description: e.target.value})} 
                    placeholder="Provide a summary of the video content..."
                  />
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold small text-muted">Upload Video or Paste Link <span className="text-danger">*</span></Form.Label>
                  <div className="d-flex gap-2 mb-3">
                    <Button
                      type="button"
                      variant={addVideoMode === 'link' ? 'success' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 fw-bold"
                      style={addVideoMode === 'link' ? { backgroundColor: '#198754', border: 'none' } : {}}
                      onClick={() => setAddVideoMode('link')}
                    >
                      <i className="bi bi-link-45deg me-1"></i> Paste YouTube/Vimeo Link
                    </Button>
                    <Button
                      type="button"
                      variant={addVideoMode === 'upload' ? 'success' : 'outline-secondary'}
                      size="sm"
                      className="rounded-pill px-3 fw-bold"
                      style={addVideoMode === 'upload' ? { backgroundColor: '#198754', border: 'none' } : {}}
                      onClick={() => setAddVideoMode('upload')}
                    >
                      <i className="bi bi-cloud-upload me-1"></i> Upload Video File
                    </Button>
                  </div>

                  {addVideoMode === 'link' ? (
                    <Form.Control
                      type="text"
                      value={addVideoForm.videoUrl}
                      onChange={e => setAddVideoForm({...addVideoForm, videoUrl: e.target.value})}
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                      required
                    />
                  ) : (
                    <div>
                      <Form.Control
                        type="file"
                        accept="video/*"
                        onChange={handleVideoModalUpload}
                        disabled={uploadingVideo}
                        className="mb-2"
                      />
                      {uploadingVideo && (
                        <ProgressBar
                          now={videoUploadProgress}
                          label={`${videoUploadProgress}%`}
                          variant="success"
                          animated
                          className="mb-2"
                          style={{ height: '8px' }}
                        />
                      )}
                      {addVideoForm.videoUrl && addVideoForm.videoUrl.includes('/uploads/') && (
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <i className="bi bi-check-circle-fill text-success"></i>
                          <span className="small text-muted">Video uploaded successfully: <code>{addVideoForm.videoUrl}</code></span>
                        </div>
                      )}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowAddVideoModal(false)}
                disabled={savingWebinar}
                className="px-4 py-2 rounded-pill fw-bold"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={savingWebinar || uploadingVideo || !addVideoForm.videoUrl}
                className="btn btn-success px-4 py-2 rounded-pill fw-bold shadow-sm"
                style={{ backgroundColor: '#198754', border: 'none' }}
              >
                {savingWebinar ? <Spinner animation="border" size="sm" /> : 'Save Recorded Video'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Share / QR Code Modal */}
      <Modal show={showShareModal} onHide={() => setShowShareModal(false)} centered size="sm">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-dark small text-uppercase">Share Webinar</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          {selectedWebinar && (
            <>
              <h6 className="fw-bold mb-3">{selectedWebinar.title}</h6>
              <div className="p-3 bg-light rounded-4 d-inline-block border mb-3">
                <QRCodeSVG 
                  id="webinar-qr-code"
                  value={`${window.location.origin}/webinar/${slugify(selectedWebinar.title)}`}
                  size={160}
                  level="H"
                />
              </div>
              
              <div className="d-flex flex-column gap-2 w-100">
                <Button variant="danger" size="sm" onClick={downloadQRCode} className="fw-bold rounded-pill">
                  <i className="bi bi-download me-1"></i> Download QR Code
                </Button>
                
                <Button variant="outline-dark" size="sm" onClick={handleCopyLink} className="fw-bold rounded-pill">
                  <i className="bi bi-link-45deg me-1"></i> {copied ? 'Copied Link!' : 'Copy Invitation Link'}
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      {/* Email Blast Modal */}
      <Modal show={showBlastModal} onHide={() => !sendingBlast && setShowBlastModal(false)} centered size="lg">
        <Modal.Header closeButton={!sendingBlast} className="bg-dark text-white border-0 p-4">
          <Modal.Title className="fw-bold text-uppercase">
            <i className="bi bi-envelope-paper-fill text-danger me-2"></i> Send Notification Blast
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <Form onSubmit={handleSendBlast}>
            <Form.Group controlId="blastSubject" className="mb-3">
              <Form.Label className="fw-bold small text-muted">Email Subject <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                type="text" 
                required 
                value={blastData.subject} 
                onChange={e => setBlastData({...blastData, subject: e.target.value})} 
                placeholder=""
              />
            </Form.Group>
            
            <Form.Group controlId="blastMessage" className="mb-4">
              <Form.Label className="fw-bold small text-muted">Email Message Content <span className="text-danger">*</span></Form.Label>
              <Form.Control 
                as="textarea" 
                rows={6} 
                required 
                value={blastData.message} 
                onChange={e => setBlastData({...blastData, message: e.target.value})} 
                placeholder=""
              />
              <Form.Text className="text-muted">
                This email will be dispatched to all registered users of this webinar. Keep links clear and readable.
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-3 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => setShowBlastModal(false)} disabled={sendingBlast} className="px-4 py-2 rounded-pill fw-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={sendingBlast} className="btn btn-danger px-4 py-2 rounded-pill fw-bold" style={{ backgroundColor: '#da251d', border: 'none' }}>
                {sendingBlast ? <Spinner animation="border" size="sm" /> : 'Send Email Notification Blast'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Dedicated Recording Video Modal */}
      <Modal show={showRecordModal} onHide={() => !savingWebinar && setShowRecordModal(false)} centered size="lg">
        <Modal.Header closeButton={!savingWebinar} className="bg-dark text-white border-0 p-4">
          <Modal.Title className="fw-bold text-uppercase" style={{ letterSpacing: '0.5px' }}>
            <i className="bi bi-film text-danger me-2"></i> Add / Edit Webinar Recording
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 p-md-5">
          {selectedWebinar && (
            <Form onSubmit={handleSaveRecordVideo}>
              <h5 className="fw-bold mb-3">Webinar: {selectedWebinar.title}</h5>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold small text-muted">Upload Video or Paste Link</Form.Label>
                <div className="d-flex gap-2 mb-3">
                  <Button
                    variant={recordModalMode === 'link' ? 'danger' : 'outline-secondary'}
                    size="sm"
                    className="rounded-pill px-3 fw-bold"
                    style={recordModalMode === 'link' ? { backgroundColor: '#da251d', border: 'none' } : {}}
                    onClick={() => setRecordModalMode('link')}
                  >
                    <i className="bi bi-link-45deg me-1"></i> Paste Recording Link
                  </Button>
                  <Button
                    variant={recordModalMode === 'upload' ? 'danger' : 'outline-secondary'}
                    size="sm"
                    className="rounded-pill px-3 fw-bold"
                    style={recordModalMode === 'upload' ? { backgroundColor: '#da251d', border: 'none' } : {}}
                    onClick={() => setRecordModalMode('upload')}
                  >
                    <i className="bi bi-cloud-upload me-1"></i> Upload Recording File
                  </Button>
                </div>

                {recordModalMode === 'link' ? (
                  <Form.Control
                    type="text"
                    value={recordForm.videoUrl}
                    onChange={e => setRecordForm({...recordForm, videoUrl: e.target.value})}
                    placeholder=""
                  />
                ) : (
                  <div>
                    <Form.Control
                      type="file"
                      accept="video/*"
                      ref={recordFileRef}
                      onChange={handleRecordVideoUpload}
                      disabled={uploadingRecord}
                      className="mb-2"
                    />
                    {uploadingRecord && (
                      <ProgressBar
                        now={recordProgress}
                        label={`${recordProgress}%`}
                        variant="danger"
                        animated
                        className="mb-2"
                        style={{ height: '8px' }}
                      />
                    )}
                    {recordForm.videoUrl && recordForm.videoUrl.includes('/uploads/') && (
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <i className="bi bi-check-circle-fill text-success"></i>
                        <span className="small text-muted">Video uploaded successfully: <code>{recordForm.videoUrl}</code></span>
                      </div>
                    )}
                  </div>
                )}
                <Form.Text className="text-muted">
                  Provide the recording of this webinar. It will show up on the past webinars or recorded video section on the website.
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                <Button 
                  variant="outline-secondary" 
                  onClick={() => setShowRecordModal(false)}
                  disabled={savingWebinar}
                  className="px-4 py-2 rounded-pill fw-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={savingWebinar || uploadingRecord}
                  className="btn btn-danger px-4 py-2 rounded-pill fw-bold shadow-sm"
                  style={{ backgroundColor: '#da251d', border: 'none' }}
                >
                  {savingWebinar ? <Spinner animation="border" size="sm" /> : 'Save Recording'}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

    </Container>
  );
};

export default ManageWebinars;
