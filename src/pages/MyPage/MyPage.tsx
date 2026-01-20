import { useAtom } from 'jotai';
import React, { useState, useEffect, useRef } from 'react';
import { updateProfilePicture } from '../../api/user';
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

  // Local state for editing mode and file object
  const [isEditing, setIsEditing] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);

  // Keep a copy of the original nickname for cancellation
  const [originalNickname, setOriginalNickname] = useState(nickname);

  // 파일 입력창(input type="file")을 열기 위한 ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      // alert("로그인이 필요한 서비스입니다.");
      // window.location.href = '/';
    }
  }, [isLoggedIn]);

  // 이미지 업로드 핸들러 (미리보기 기능)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfileImage(result); // Update atom for immediate preview
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
    setOriginalNickname(nickname); // Save current nickname on edit start
  };

  // 저장 버튼 클릭 시
  const handleSave = async () => {
    try {
      if (profileImageFile) {
        const response = await updateProfilePicture(profileImageFile);
        setProfileImage(response.profileImageUrl); // Update global state
      }

      // Here you would also have an API call to update the nickname
      // await updateNickname(nickname);
      // For now, we just set the atom, which is already done by the input's onChange

      setIsEditing(false);
      alert('프로필이 수정되었습니다!');
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      alert('프로필 수정에 실패했습니다.');
      setNickname(originalNickname); // Revert on failure
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNickname(originalNickname); // Restore original nickname
    // The profile image will also revert because we're not saving the file change
    // You might need a more robust way to handle image cancellation if needed
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
            <span className="email-text">{email || 'guest@snu.ac.kr'}</span>
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
              <button className="cancel-btn" onClick={handleCancel}>
                취소
              </button>
            </>
          ) : (
            <button className="edit-btn" onClick={handleEdit}>
              프로필 수정
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
