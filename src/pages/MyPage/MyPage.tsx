import React, { useState, useEffect, useRef } from 'react';
import { userState } from '../../common/user';
import './MyPage.css';

const MyPage = () => {
  // 1. 초기값 설정 (userState에서 가져옴)
  const [nickname, setNickname] = useState(userState.nickname || '익명');
  const [profileImage, setProfileImage] = useState<string | null>(
    userState.profileImage
  );
  const [isEditing, setIsEditing] = useState(false); // 수정 모드 여부

  // 파일 입력창(input type="file")을 열기 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 로그인 안 된 상태로 접근 시 처리 (예시)
    if (!userState.isLoggedIn && !userState.email) {
      // 실제로는 로그인 페이지로 리다이렉트 하거나 경고 표시
      // alert("로그인이 필요한 서비스입니다.");
      // window.location.href = '/';
    }
  }, []);

  // 이미지 업로드 핸들러 (미리보기 기능)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result); // 화면에 즉시 반영
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

  // 저장 버튼 클릭 시
  const handleSave = () => {
    // 2. 변경된 정보를 전역 userState에 저장 (API 연결 시 여기서 axios.put 호출)
    userState.nickname = nickname;
    userState.profileImage = profileImage;

    // console.log('저장된 정보:', { nickname, profileImage }); // 디버깅용

    setIsEditing(false);
    alert('프로필이 수정되었습니다!');
  };

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
            {/* 이메일은 수정 불가 (Google 로그인 정보) */}
            <span className="email-text">
              {userState.email || 'guest@snu.ac.kr'}
            </span>
          </div>

          <div className="info-row">
            <label>별명</label>
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

        {/* 버튼 영역 */}
        <div className="button-group">
          {isEditing ? (
            <>
              <button className="save-btn" onClick={handleSave}>
                저장
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsEditing(false);
                  setNickname(userState.nickname); // 취소 시 원래 값 복구
                  setProfileImage(userState.profileImage);
                }}
              >
                취소
              </button>
            </>
          ) : (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              프로필 수정
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
