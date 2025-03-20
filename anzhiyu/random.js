var posts=["2025/03/06/hello-world/","2025/03/20/pre-zhzx/","2025/03/20/presentation/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };