import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { submitTermsAgreement, withdrawUser } from '../../api/auth';
import { BACKEND_URL } from '../../api/constants';

const Terms = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL 쿼리스트링에서 token 파싱
  const token = searchParams.get('token');

  useEffect(() => {
    // 토큰이 없으면 잘못된 접근으로 간주하고 메인으로 이동
    if (!token) {
      alert('잘못된 접근입니다.');
      navigate('/');
    }
  }, [token, navigate]);

  const handleAgree = async () => {
    if (!token) return;

    try {
      // 약관 동의 API 호출
      await submitTermsAgreement(token);
      // 성공 시 메인페이지로 이동
      navigate('/');
    } catch (error) {
      console.error('약관 동의 실패:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleDisagree = async () => {
    // 사용자 탈퇴 API 호출
    try {
      await withdrawUser();
    } catch (error) {
      console.error('User withdrawal failed:', error);
      alert('회원 탈퇴 중 오류가 발생했습니다. 다시 시도해주세요.');
      // Proceed with logout even if withdrawal fails, to prevent user being stuck
    }

    // 동의 거부 시 로그아웃 처리 (Navbar와 동일한 로직)
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);

    // 백엔드 로그아웃 엔드포인트로 리다이렉트
    window.location.href = `${BACKEND_URL}/logout?redirect_uri=${encodedUri}`;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: '20px',
      }}
    >
      <h1>서비스 이용 약관 동의</h1>
      <div
        style={{
          margin: '30px 0',
          border: '1px solid #ddd',
          padding: '20px',
          width: '100%',
          maxWidth: '600px',
          height: '300px',
          overflowY: 'auto',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <p>
          <strong>제 1 조 (목적)</strong>
          <br />이 약관은 SNUXI(이하 "서비스")의 이용 조건 및 절차, 이용자와
          서비스 제공자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        <p>(약관 내용..)</p>
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={handleAgree}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          동의하고 시작하기
        </button>
        <button
          onClick={handleDisagree}
          style={{
            padding: '12px 24px',
            cursor: 'pointer',
            backgroundColor: '#9e9e9e',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
          }}
        >
          동의하지 않음 (로그아웃)
        </button>
      </div>
    </div>
  );
};

export default Terms;
