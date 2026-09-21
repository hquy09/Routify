from fastapi import APIRouter, Query
from typing import Optional, Dict, Any, List
from datetime import datetime
import hashlib
import random
import urllib.request
import json

router = APIRouter()

PHILOSOPHICAL_QUOTES: List[Dict[str, str]] = [
    # CHỦ NGHĨA KHẮC KỶ (STOICISM)
    {
        "quote": "Hạnh phúc của cuộc đời phụ thuộc vào chất lượng của những suy nghĩ trong tâm trí bạn.",
        "author": "Marcus Aurelius",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "The happiness of your life depends upon the quality of your thoughts."
    },
    {
        "quote": "Bạn có quyền năng làm chủ tâm trí mình, chứ không phải các sự kiện bên ngoài. Thấu hiểu điều này, bạn sẽ tìm thấy sức mạnh nội tại.",
        "author": "Marcus Aurelius",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "You have power over your mind - not outside events. Realize this, and you will find strength."
    },
    {
        "quote": "Đừng lãng phí thời gian tranh cãi thế nào là một người tốt. Hãy bắt đầu là một người tốt ngay lúc này.",
        "author": "Marcus Aurelius",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "Waste no more time arguing what a good man should be. Be one."
    },
    {
        "quote": "Khó khăn cản đường chính là con đường dẫn tới sự trưởng thành.",
        "author": "Marcus Aurelius",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "The impediment to action advances action. What stands in the way becomes the way."
    },
    {
        "quote": "Chúng ta đau khổ trong sự tưởng tượng và lo âu nhiều hơn là trong thực tế.",
        "author": "Seneca",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "We suffer more often in imagination than in reality."
    },
    {
        "quote": "Khó khăn thử thách rèn luyện tâm trí, cũng giống như lao động tôi luyện thể xác.",
        "author": "Seneca",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "Difficulties strengthen the mind, as labor does the body."
    },
    {
        "quote": "Thời gian là tài sản quý giá nhất, nhưng lại là thứ con người hoang phí dễ dàng nhất.",
        "author": "Seneca",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "It is not that we have a short time to live, but that we waste a lot of it."
    },
    {
        "quote": "Không phải sự việc làm ta phiền não, mà chính là cách ta nhìn nhận và phán xét sự việc đó.",
        "author": "Epictetus",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "Men are disturbed not by things, but by the view which they take of them."
    },
    {
        "quote": "Không ai có thể tự do nếu không làm chủ được chính bản thân mình.",
        "author": "Epictetus",
        "school": "Chủ nghĩa Khắc kỷ (Stoicism)",
        "original_quote": "No man is free who is not master of himself."
    },

    # TRIẾT HỌC ĐÔNG PHƯƠNG (EASTERN PHILOSOPHY)
    {
        "quote": "Hành trình vạn dặm khởi đầu từ một bước chân vững chãi.",
        "author": "Lão Tử",
        "school": "Đạo gia (Taoism)",
        "original_quote": "A journey of a thousand miles begins with a single step."
    },
    {
        "quote": "Biết người là thông minh, biết mình mới là bậc giác ngộ. Chiến thắng kẻ khác là có sức lực, chiến thắng chính mình mới là kẻ thực sự quyền năng.",
        "author": "Lão Tử",
        "school": "Đạo gia (Taoism)",
        "original_quote": "He who knows others is wise; he who knows himself is enlightened. He who conquers others has physical power; he who conquers himself is mighty."
    },
    {
        "quote": "Nước mềm mại nhất thiên hạ, nhưng không vật cứng rắn nào phá vỡ được sự kiên trì của nước.",
        "author": "Lão Tử",
        "school": "Đạo gia (Taoism)",
        "original_quote": "Water is fluid, soft, and yielding. But water will wear away rock, which is rigid and cannot yield."
    },
    {
        "quote": "Không quan trọng bạn đi chậm thế nào, miễn là bạn không bao giờ dừng lại.",
        "author": "Khổng Tử",
        "school": "Nho gia (Confucianism)",
        "original_quote": "It does not matter how slowly you go as long as you do not stop."
    },
    {
        "quote": "Học mà không suy nghĩ thì uổng công; suy nghĩ mà không học hỏi thì nguy hiểm.",
        "author": "Khổng Tử",
        "school": "Nho gia (Confucianism)",
        "original_quote": "Learning without thought is labor lost; thought without learning is perilous."
    },
    {
        "quote": "Người biết đủ luôn luôn giàu có. Kẻ biết định tâm thì vạn sự an nhiên.",
        "author": "Trang Tử",
        "school": "Đạo gia (Taoism)",
        "original_quote": "Contentment brings continuous abundance and peace of mind."
    },
    {
        "quote": "Chiến thắng vạn quân giặc trên chiến trường không bằng tự chiến thắng chính mình. Chiến thắng bản thân là chiến công vĩ đại nhất.",
        "author": "Đức Phật Thích Ca",
        "school": "Triết học Phật giáo",
        "original_quote": "It is better to conquer yourself than to win a thousand battles. Then the victory is yours."
    },
    {
        "quote": "Tâm là nguồn gốc của mọi hành vi. Giữ tâm trong sáng, bình an sẽ theo bạn như hình với bóng.",
        "author": "Đức Phật Thích Ca",
        "school": "Triết học Phật giáo",
        "original_quote": "The mind is everything. What you think you become."
    },

    # TRIẾT HỌC CỔ HIỆN ĐẠI TÂY PHƯƠNG (WESTERN CLASSICAL & MODERN)
    {
        "quote": "Một cuộc đời không được suy xét kỹ lưỡng là một cuộc đời không đáng sống.",
        "author": "Socrates",
        "school": "Triết học Hy Lạp Cổ đại",
        "original_quote": "The unexamined life is not worth living."
    },
    {
        "quote": "Tôi chỉ biết chắc một điều duy nhất, đó là tôi không biết gì cả.",
        "author": "Socrates",
        "school": "Triết học Hy Lạp Cổ đại",
        "original_quote": "I know that I am intelligent, because I know that I know nothing."
    },
    {
        "quote": "Khởi đầu chính là phần quan trọng nhất của mọi công việc.",
        "author": "Plato",
        "school": "Triết học Hy Lạp Cổ đại",
        "original_quote": "The beginning is the most important part of the work."
    },
    {
        "quote": "Chúng ta là những gì chúng ta lặp đi lặp lại hàng ngày. Do đó, sự xuất sắc không phải là một hành động ngẫu nhiên, mà là một thói quen.",
        "author": "Aristotle",
        "school": "Triết học Hy Lạp Cổ đại",
        "original_quote": "We are what we repeatedly do. Excellence, then, is not an act, but a habit."
    },
    {
        "quote": "Thấu hiểu bản thân là khởi đầu của mọi sự khôn ngoan đích thực.",
        "author": "Aristotle",
        "school": "Triết học Hy Lạp Cổ đại",
        "original_quote": "Knowing yourself is the beginning of all wisdom."
    },
    {
        "quote": "Người có một lý do đủ lớn để sống có thể chịu đựng được hầu hết mọi nghịch cảnh.",
        "author": "Friedrich Nietzsche",
        "school": "Chủ nghĩa Hiện sinh",
        "original_quote": "He who has a why to live can bear almost any how."
    },
    {
        "quote": "Những gì không thể đánh gục được tôi sẽ chỉ làm cho tôi trở nên mạnh mẽ hơn.",
        "author": "Friedrich Nietzsche",
        "school": "Chủ nghĩa Hiện sinh",
        "original_quote": "What does not kill me makes me stronger."
    },
    {
        "quote": "Tôi tư duy, nên tôi tồn tại (Cogito, ergo sum).",
        "author": "René Descartes",
        "school": "Chủ nghĩa Duy lý (Rationalism)",
        "original_quote": "I think, therefore I am."
    },
    {
        "quote": "Tài năng bắn trúng mục tiêu mà không ai bắn trúng; thiên tài bắn trúng mục tiêu mà không ai nhìn thấy.",
        "author": "Arthur Schopenhauer",
        "school": "Triết học Đức Cổ điển",
        "original_quote": "Talent hits a target no one else can hit; Genius hits a target no one else can see."
    },
    {
        "quote": "Con người bị kết án là phải tự do; bởi một khi đã bước vào thế giới, ta chịu trách nhiệm cho tất cả mọi lựa chọn của mình.",
        "author": "Jean-Paul Sartre",
        "school": "Chủ nghĩa Hiện sinh",
        "original_quote": "Man is condemned to be free; because once thrown into the world, he is responsible for everything he does."
    },

    # TRÍ TUỆ KHOA HỌC & TƯ DUY HIỆN ĐẠI (SCIENTIFIC & INNOVATIVE MINDS)
    {
        "quote": "Giữa những nghịch cảnh và khó khăn luôn luôn ẩn chứa những cơ hội tuyệt vời.",
        "author": "Albert Einstein",
        "school": "Trí tuệ Khoa học",
        "original_quote": "In the middle of difficulty lies opportunity."
    },
    {
        "quote": "Kỷ luật là cầu nối vững chắc giữa những mục tiêu đề ra và thành tựu đạt được.",
        "author": "Jim Rohn",
        "school": "Triết lý Phát triển Cá nhân",
        "original_quote": "Discipline is the bridge between goals and accomplishment."
    },
    {
        "quote": "Thời gian của bạn là có hạn, đừng lãng phí nó để sống cuộc đời theo kỳ vọng của người khác.",
        "author": "Steve Jobs",
        "school": "Tư duy Sáng tạo & Lãnh đạo",
        "original_quote": "Your time is limited, so don't waste it living someone else's life."
    },
    {
        "quote": "Sự đơn giản và tinh gọn là đỉnh cao của sự tinh tế và thấu suốt.",
        "author": "Leonardo da Vinci",
        "school": "Nghệ thuật & Khoa học Phục hưng",
        "original_quote": "Simplicity is the ultimate sophistication."
    },
    {
        "quote": "Bí quyết của tự do và an lạc là học cách tập trung trọn vẹn vào giây phút hiện tại.",
        "author": "Alan Watts",
        "school": "Triết học Đương đại",
        "original_quote": "The secret of life is to be completely engaged with what you are doing in the here and now."
    }
]

def fetch_external_quote() -> Optional[Dict[str, str]]:
    """Attempt to fetch a quote from a public quote API."""
    try:
        req = urllib.request.Request(
            "https://dummyjson.com/quotes/random",
            headers={"User-Agent": "LifeOS/1.0"}
        )
        res = urllib.request.urlopen(req, timeout=3).read().decode("utf-8")
        data = json.loads(res)
        return {
            "quote": data.get("quote", ""),
            "author": data.get("author", "Khuyết danh"),
            "school": "Trích dẫn Quốc tế (API)",
            "original_quote": data.get("quote", "")
        }
    except Exception:
        return None

@router.get("/hourly")
def get_hourly_quote(refresh: bool = Query(False, description="Force random quote rather than hourly")) -> Dict[str, Any]:
    """
    Returns a philosophical quote that rotates automatically every hour.
    If refresh=true, returns an immediate random quote.
    """
    now = datetime.now()
    hour_key = now.strftime("%Y-%m-%d-%H")

    if refresh:
        selected = random.choice(PHILOSOPHICAL_QUOTES)
    else:
        # Deterministic index based on current hour
        hash_digest = hashlib.md5(hour_key.encode("utf-8")).hexdigest()
        index = int(hash_digest, 16) % len(PHILOSOPHICAL_QUOTES)
        selected = PHILOSOPHICAL_QUOTES[index]

    return {
        "hour_key": hour_key,
        "current_hour": now.hour,
        "timestamp": now.isoformat(),
        "quote": selected["quote"],
        "author": selected["author"],
        "school": selected["school"],
        "original_quote": selected.get("original_quote"),
        "total_collection": len(PHILOSOPHICAL_QUOTES)
    }

@router.get("/random")
def get_random_quote(external: bool = Query(False)) -> Dict[str, Any]:
    """Returns an instant random quote."""
    if external:
        ext = fetch_external_quote()
        if ext:
            return ext
    return random.choice(PHILOSOPHICAL_QUOTES)
