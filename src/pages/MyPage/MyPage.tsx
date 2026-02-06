import { isAxiosError } from 'axios';
import { useAtom } from 'jotai';
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BACKEND_URL } from '../../api/constants';
import { updateProfilePicture, updateUsername } from '../../api/user';
import {
  emailAtom,
  isLoggedInAtom,
  nicknameAtom,
  profileImageAtom,
} from '../../common/user';
import './MyPage.css';

const MyPage = () => {
  const [isLoggedIn] = useAtom(isLoggedInAtom);
  const [email] = useAtom(emailAtom);
  const [nickname, setNickname] = useAtom(nicknameAtom);
  const [profileImage, setProfileImage] = useAtom(profileImageAtom);

  // 로컬 상태 관리 (수정 모드, 파일 객체 등)
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  // Removed: const [showTermsModal, setShowTermsModal] = useState(false); // New state

  // 취소 시 되돌리기 위한 원래 이름 저장
  const [originalNickname, setOriginalNickname] = useState(nickname);

  // 파일 입력창(input type="file")을 열기 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate(); // Added navigate hook

  // 로그인 핸들러 (버튼 클릭 시 호출)
  const handleLogin = () => {
    const frontendRedirectUri = window.location.origin;
    const encodedUri = encodeURIComponent(frontendRedirectUri);
    const googleLoginUrl = `${BACKEND_URL}/login?redirect_uri=${encodedUri}`;
    window.location.href = googleLoginUrl;
  };

  // 이미지 업로드 핸들러 (미리보기 기능)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 클릭 시 파일 선택창 열기
  const triggerFileSelect = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setOriginalNickname(nickname);
  };

  // 저장 버튼 클릭 시
  const handleSave = async () => {
    try {
      if (profileImageFile) {
        const newImageUrl = await updateProfilePicture(profileImageFile);
        setProfileImage(newImageUrl);
      }

      await updateUsername(nickname);

      setIsEditing(false);
      alert('프로필이 수정되었습니다!');
    } catch (error: unknown) {
      if (isAxiosError(error)) {
        console.error('프로필 수정 실패:', error.response?.data);
      } else {
        console.error('An unexpected error occurred:', error);
      }
      alert('프로필 수정에 실패했습니다.');
      setNickname(originalNickname);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNickname(originalNickname);
  };

  // [수정] 로그인되지 않은 경우 안내 문구와 로그인 버튼 표시
  if (!isLoggedIn) {
    return (
      <div className="mypage-container" style={{ marginTop: '20vh' }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>
          로그인이 필요한 서비스입니다
        </h2>
        <button
          className="save-btn" // 기존 스타일 재사용 (파란색 버튼)
          onClick={handleLogin}
          style={{ fontSize: '1rem', padding: '12px 30px' }}
        >
          로그인
        </button>
      </div>
    );
  }

  return (
    <div className="mypage-container">
      <h1>마이페이지</h1>

      <div className="profile-card">
        {/* 프로필 이미지 영역 */}
        <div className="profile-image-wrapper" onClick={triggerFileSelect}>
          <img
            src={profileImage || 'https://via.placeholder.com/150?text=Profile'}
            alt="프로필 사진"
            className={`profile-image ${isEditing ? 'editable' : ''}`}
          />
          {isEditing && <div className="overlay">📷 변경</div>}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </div>

        {/* 사용자 정보 영역 */}
        <div className="profile-info">
          <div className="info-row">
            <label>이메일</label>
            <span className="email-text">{email || 'guest@snu.ac.kr'}</span>
          </div>

          <div className="info-row">
            <label>이름</label>
            {isEditing ? (
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="nickname-input"
              />
            ) : (
              <span className="nickname-text">{nickname}</span>
            )}
          </div>
        </div>

        <div className="button-group">
          {isEditing ? (
            <>
              <button className="save-btn" onClick={handleSave}>
                저장
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                취소
              </button>
            </>
          ) : (
            <button className="edit-btn" onClick={handleEdit}>
              프로필 수정
            </button>
          )}
          <button className="terms-btn" onClick={() => navigate('/terms')}>
            약관 및 정책
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
