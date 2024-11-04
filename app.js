// 구글 스프레드시트 ID와 관련 상수들
const SHEET_ID = '1ItJxhB9yyVUe8yRxz53GRPQZ-gJMrbnpvLFVS3FjT7k';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTucJvGPv1AvShM2re1Nxf2zX3Mms5ZfkClHCCZd6cgBegXkrNdjq75_trno8u_nFQX8ZPN427ps4MZ/pubhtml';
const SHEET_NAME = 'Sheet1';
const API_KEY = 'AIzaSyDGDdMNaTfrGJ_urhDsJ0zzNh2fQuao9QQ';

let allRestaurants = [];

// 레스토랑 데이터 로드 함수
function loadRestaurants() {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            allRestaurants = data.values.slice(1).reverse();
            displayRestaurants(allRestaurants);
            hideLoading();
        })
        .catch(error => {
            console.error('Error loading restaurants:', error);
            hideLoading();
        });
}

// 레스토랑 표시 함수
function displayRestaurants(restaurants) {
    const restaurantList = document.getElementById('restaurant-list');
    restaurantList.innerHTML = '';

    restaurants.forEach(restaurant => {
        const [지역, 도시, 식당명, 전화번호, 주소, 주메뉴, 특징, 이미지, 지도] = restaurant;
        
        // 텍스트 길이 제한 함수
        const truncateText = (text, maxLength) => {
            if (!text) return '정보 없음';
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };

        const restaurantElement = document.createElement('div');
        restaurantElement.classList.add('restaurant');
        restaurantElement.innerHTML = `
            ${이미지 ? `<div class="restaurant-thumbnail">
                <img src="${이미지}" alt="${식당명}" onerror="this.style.display='none'">
            </div>` : ''}
            <h2>${식당명}</h2>
            <p><i class="fas fa-map-marker-alt"></i> <strong>지역</strong> <span>${지역} ${도시}</span></p>
            <p><i class="fas fa-location-dot"></i> <strong>주소</strong> <span>${truncateText(주소, 30)}</span></p>
            <p><i class="fas fa-phone"></i> <strong>전화번호</strong> <span>${전화번호}</span></p>
            <p><i class="fas fa-utensils"></i> <strong>주메뉴</strong> <span>${truncateText(주메뉴, 20)}</span></p>
            <p><i class="fas fa-star"></i> <strong>특징</strong> <span>${truncateText(특징, 30) || '정보 없음'}</span></p>
            <a href="${지도}" target="_blank" class="map-btn">네이버지도보기</a>
            <span class="detail-text">자세히 보기</span>
        `;

        // 카드 클릭 이벤트 추가
        restaurantElement.addEventListener('click', async (e) => {
            if (e.target.tagName === 'A' || e.target.classList.contains('map-btn')) {
                return;
            }
            await showRestaurantDetail(restaurant);
        });

        restaurantList.appendChild(restaurantElement);
    });
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// 검색 기능
function searchRestaurants() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filteredRestaurants = allRestaurants.filter(restaurant => {
        const [지역, 도시, 식당명] = restaurant;
        return 지역.toLowerCase().includes(searchInput) ||
               도시.toLowerCase().includes(searchInput) ||
               식당명.toLowerCase().includes(searchInput);
    });
    displayRestaurants(filteredRestaurants);
}

// 페이지 로드 시 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    loadRestaurants();
    document.getElementById('search-button').addEventListener('click', searchRestaurants);
    document.getElementById('search-input').addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            searchRestaurants();
        }
    });
});

// Firebase 관련 함수들...
async function showRestaurantDetail([지역, 도시, 식당명, 전화번호, 주소, 주메뉴, 특징, 이미지, 지도]) {
    try {
        const likes = await getLikes(식당명) || 0;
        const comments = await getComments(식당명) || [];
        
        await Swal.fire({
            title: 식당명,
            html: `
                <div class="restaurant-detail">
                    <div class="detail-grid">
                        <div class="detail-image-section">
                            ${이미지 ? `<img src="${이미지}" alt="${식당명}" class="detail-image">` : 
                            '<div class="no-image">이미지가 없습니다</div>'}
                        </div>
                        <div class="detail-info">
                            <p><i class="fas fa-map-marker-alt"></i> <strong>지역:</strong> ${지역} ${도시}</p>
                            <p><i class="fas fa-location-dot"></i> <strong>주소:</strong> ${주소}</p>
                            <p><i class="fas fa-phone"></i> <strong>전화번호:</strong> ${전화번호}</p>
                            <p><i class="fas fa-utensils"></i> <strong>주메뉴:</strong> ${주메뉴}</p>
                            <p><i class="fas fa-star"></i> <strong>특징:</strong> ${특징 || '정보 없음'}</p>
                            <div class="map-link">
                                <a href="${지도}" target="_blank" class="naver-map-btn">
                                    <i class="fas fa-map"></i> 네이버 지도에서 보기
                                </a>
                            </div>
                        </div>
                    </div>
                    <div class="interaction-section">
                        <div class="likes-section">
                            <button class="like-btn ${await isLiked(식당명) ? 'liked' : ''}" 
                                    onclick="toggleLike('${식당명}')">
                                <i class="fas fa-heart"></i> ${likes}
                            </button>
                        </div>
                        <div class="comments-section">
                            <h3>댓글</h3>
                            <div class="comment-input-group">
                                <input type="text" id="commentInput" placeholder="댓글을 입력하세요">
                                <input type="password" id="commentPassword" placeholder="비밀번호">
                                <button onclick="addComment('${식당명}')">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                            <div class="comments-list">
                                ${comments.map(comment => `
                                    <div class="comment" id="comment-${comment.id}">
                                        <div class="comment-content">
                                            <div class="comment-text">${comment.text}</div>
                                            <div class="comment-edit-form" style="display: none;">
                                                <input type="text" class="edit-input" value="${comment.text}">
                                                <input type="password" class="edit-password" placeholder="비밀번호">
                                                <div class="edit-buttons">
                                                    <button onclick="saveComment('${comment.id}', '${식당명}')">저장</button>
                                                    <button onclick="cancelEdit('${comment.id}')">취소</button>
                                                </div>
                                            </div>
                                            <div class="comment-actions">
                                                <button onclick="startEdit('${comment.id}')">수정</button>
                                                <button onclick="deleteComment('${comment.id}', '${식당명}')">삭제</button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            `,
            width: '900px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'restaurant-modal',
                closeButton: 'modal-close-button'
            }
        });
    } catch (error) {
        console.error('Error showing restaurant detail:', error);
        alert('상세 정보를 불러오는데 실패했습니다.');
    }
}

// Firebase 관련 나머지 함수들은 이전 답변과 동일하게 유지

// Firebase 관련 함수들
async function getComments(restaurantName) {
    try {
        const commentsQuery = query(
            collection(db, "comments"),
            where("restaurantName", "==", restaurantName)
        );
        const querySnapshot = await getDocs(commentsQuery);
        const comments = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        return comments.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
        console.error("Error getting comments:", error);
        return [];
    }
}

async function addComment(restaurantName) {
    const input = document.getElementById('commentInput');
    const passwordInput = document.getElementById('commentPassword');
    const comment = input.value.trim();
    const password = passwordInput.value.trim();
    
    if (comment && password) {
        try {
            await addDoc(collection(db, "comments"), {
                restaurantName,
                text: comment,
                password,
                timestamp: new Date().getTime()
            });
            
            input.value = '';
            passwordInput.value = '';
            // 댓글 추가 후 상세 정보 다시 로드
            const restaurantData = allRestaurants.find(r => r[2] === restaurantName);
            if (restaurantData) {
                await showRestaurantDetail(restaurantData);
            }
        } catch (error) {
            console.error("Error adding comment:", error);
            alert('댓글 작성에 실패했습니다.');
        }
    }
}

async function editComment(commentId, restaurantName) {
    const password = prompt('댓글 비밀번호를 입력하세요:');
    if (!password) return;

    try {
        const commentDoc = doc(db, "comments", commentId);
        const commentSnapshot = await getDoc(commentDoc);
        
        if (!commentSnapshot.exists()) {
            alert('댓글을 찾을 수 없습니다.');
            return;
        }

        const commentData = commentSnapshot.data();
        if (commentData.password !== password) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        const newText = prompt('수정할 내용을 입력하세요:', commentData.text);
        if (newText && newText.trim()) {
            await updateDoc(commentDoc, { text: newText.trim() });
            const restaurantData = allRestaurants.find(r => r[2] === restaurantName);
            if (restaurantData) {
                await showRestaurantDetail(restaurantData);
            }
        }
    } catch (error) {
        console.error("Error editing comment:", error);
        alert('댓글 수정에 실패했습니다.');
    }
}

async function deleteComment(commentId, restaurantName) {
    const password = prompt('댓글 비밀번호를 입력하세요:');
    if (!password) return;

    try {
        const commentDoc = doc(db, "comments", commentId);
        const commentSnapshot = await getDoc(commentDoc);
        
        if (!commentSnapshot.exists()) {
            alert('댓글을 찾을 수 없습니다.');
            return;
        }

        const commentData = commentSnapshot.data();
        if (commentData.password !== password) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        await deleteDoc(commentDoc);
        const restaurantData = allRestaurants.find(r => r[2] === restaurantName);
        if (restaurantData) {
            await showRestaurantDetail(restaurantData);
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
        alert('댓글 삭제에 실패했습니다.');
    }
}

async function getLikes(restaurantName) {
    try {
        const likesQuery = query(
            collection(db, "likes"),
            where("restaurantName", "==", restaurantName)
        );
        const querySnapshot = await getDocs(likesQuery);
        return querySnapshot.size;
    } catch (error) {
        console.error("Error getting likes:", error);
        return 0;
    }
}

async function isLiked(restaurantName) {
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) return false;

        const likeQuery = query(
            collection(db, "likes"),
            where("restaurantName", "==", restaurantName),
            where("userId", "==", userId)
        );
        const querySnapshot = await getDocs(likeQuery);
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking if liked:", error);
        return false;
    }
}

async function toggleLike(restaurantName) {
    try {
        const userId = localStorage.getItem('userId') || crypto.randomUUID();
        localStorage.setItem('userId', userId);

        const likesRef = collection(db, "likes");
        const likeQuery = query(
            likesRef,
            where("restaurantName", "==", restaurantName),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(likeQuery);
        
        if (querySnapshot.empty) {
            await addDoc(likesRef, {
                restaurantName,
                userId,
                timestamp: new Date().getTime()
            });
        } else {
            const likeDoc = querySnapshot.docs[0];
            await deleteDoc(doc(db, "likes", likeDoc.id));
        }

        // 좋아요 토글 후 상세 정보 다시 로드
        const restaurantData = allRestaurants.find(r => r[2] === restaurantName);
        if (restaurantData) {
            await showRestaurantDetail(restaurantData);
        }
    } catch (error) {
        console.error("Error toggling like:", error);
        alert('좋아요 처리에 실패했습니다.');
    }
}

// 수정 시작 함수
async function startEdit(commentId) {
    const commentDiv = document.getElementById(`comment-${commentId}`);
    const textDiv = commentDiv.querySelector('.comment-text');
    const editForm = commentDiv.querySelector('.comment-edit-form');
    
    textDiv.style.display = 'none';
    editForm.style.display = 'block';
}

// 수정 취소 함수
async function cancelEdit(commentId) {
    const commentDiv = document.getElementById(`comment-${commentId}`);
    const textDiv = commentDiv.querySelector('.comment-text');
    const editForm = commentDiv.querySelector('.comment-edit-form');
    
    textDiv.style.display = 'block';
    editForm.style.display = 'none';
}

// 댓글 저장 함수
async function saveComment(commentId, restaurantName) {
    const commentDiv = document.getElementById(`comment-${commentId}`);
    const editInput = commentDiv.querySelector('.edit-input');
    const passwordInput = commentDiv.querySelector('.edit-password');
    
    const newText = editInput.value.trim();
    const password = passwordInput.value.trim();

    if (!newText || !password) {
        alert('내용과 비밀번호를 모두 입력해주세요.');
        return;
    }

    try {
        const commentDoc = doc(db, "comments", commentId);
        const commentSnapshot = await getDoc(commentDoc);
        
        if (!commentSnapshot.exists()) {
            alert('댓글을 찾을 수 없습니다.');
            return;
        }

        const commentData = commentSnapshot.data();
        if (commentData.password !== password) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        await updateDoc(commentDoc, { text: newText });
        
        // 수정 후 상세 정보 다시 로드
        const restaurantData = allRestaurants.find(r => r[2] === restaurantName);
        if (restaurantData) {
            await showRestaurantDetail(restaurantData);
        }
    } catch (error) {
        console.error("Error saving comment:", error);
        alert('댓글 수정에 실패했습니다.');
    }
}

// window 객체에 함수들 추가
window.addComment = addComment;
window.editComment = editComment;
window.deleteComment = deleteComment;
window.toggleLike = toggleLike;
window.startEdit = startEdit;
window.cancelEdit = cancelEdit;
window.saveComment = saveComment;

