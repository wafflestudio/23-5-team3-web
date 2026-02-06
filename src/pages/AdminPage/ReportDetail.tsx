import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { ReportDetail as ReportDetailType } from '../../api/admin';
import {
  getReportById,
  markReportAsProcessed,
  suspendUser,
} from '../../api/admin';
import { userRoleAtom } from '../../common/user';
import './ReportDetail.css';

const ReportDetail = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const [userRole] = useAtom(userRoleAtom);
  const [report, setReport] = useState<ReportDetailType | null>(null);
  const [_loading, setLoading] = useState(true); // Start with loading true
  const [_error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Wait until userRole is resolved before checking
    if (userRole && userRole !== 'ADMIN') {
      alert('You do not have permission to access this page.');
      navigate('/');
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === 'ADMIN' && reportId) {
      const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await getReportById(parseInt(reportId, 10));
          setReport(response);
        } catch (err: unknown) {
          if (isAxiosError(err) && err.response?.status === 403) {
            setError('You do not have permission to view this page.');
          } else {
            setError('Error fetching report details.');
          }
          console.error('Error fetching report:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [reportId, userRole]);

  const handleMarkAsProcessed = async () => {
    if (!report || actionLoading) return;
    setActionLoading(true);
    try {
      await markReportAsProcessed(report.id);
      setReport({ ...report, isProcessed: true });
      alert('Report marked as processed.');
    } catch (err) {
      alert('Failed to mark report as processed.');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!report || actionLoading) return;
    if (
      window.confirm(
        `Are you sure you want to suspend user ${report.reportedEmail}?`
      )
    ) {
      setActionLoading(true);
      try {
        const response = await suspendUser(report.reportedUserId);
        alert(
          `User ${report.reportedEmail} suspended for ${response.days} days.`
        );
      } catch (err) {
        alert('Failed to suspend user.');
        console.error(err);
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (userRole !== 'ADMIN') {
    return (
      <div className="report-detail-container">Access Denied or Loading...</div>
    );
  }

  if (_loading) {
    return (
      <div className="report-detail-container">Loading report details...</div>
    );
  }

  if (_error) {
    return <div className="report-detail-container">Error: {_error}</div>;
  }

  if (!report) {
    return <div className="report-detail-container">Report not found.</div>;
  }

  return (
    <div className="report-detail-container">
      <Link to="/admin" className="back-link">
        &larr; Back to Reports
      </Link>
      <h1>Report #{report.id}</h1>

      <div className="report-actions">
        <button
          className="action-button"
          onClick={handleMarkAsProcessed}
          disabled={report.isProcessed || actionLoading}
        >
          {actionLoading ? 'Processing...' : 'Mark as Processed'}
        </button>
        <button
          className="action-button suspend"
          onClick={handleSuspendUser}
          disabled={actionLoading}
        >
          {actionLoading ? 'Suspending...' : 'Suspend User'}
        </button>
      </div>

      <div className="report-info-grid">
        <div className="info-item">
          <strong>ID:</strong> {report.id}
        </div>
        <div className="info-item">
          <strong>Status:</strong>
          <span
            className={`status ${report.isProcessed ? 'processed' : 'unprocessed'}`}
          >
            {report.isProcessed ? 'Processed' : 'Unprocessed'}
          </span>
        </div>
        <div className="info-item">
          <strong>Reason:</strong> {report.reason}
        </div>
        <div className="info-item">
          <strong>Reported At:</strong>{' '}
          {new Date(report.reportedAt).toLocaleString()}
        </div>
        <div className="info-item">
          <strong>Reporter:</strong> {report.reporterEmail} (
          {report.reporterUserId})
        </div>
        <div className="info-item">
          <strong>Reported User:</strong> {report.reportedEmail} (
          {report.reportedUserId})
        </div>
      </div>

      <h2>Chat Logs</h2>
      <div className="chat-logs">
        {report.chatLogs.map((log) => (
          <div key={log.id} className="chat-log-item">
            <span className="log-username">
              {log.username} ({log.senderId}):
            </span>
            <p className="log-text">{log.text}</p>
            <span className="log-time">
              {new Date(log.datetimeSendAt).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportDetail;
