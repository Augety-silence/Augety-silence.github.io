var posts=["2025/04/01/birthday2025/","2025/03/06/fayangao/","2025/03/20/presentation/","2025/03/20/pre-zhzx/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };