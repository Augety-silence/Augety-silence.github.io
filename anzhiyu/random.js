var posts=["2025/03/31/birthday2024/","2025/03/06/fayangao/","2025/03/20/pre-zhzx/","2025/03/20/presentation/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };