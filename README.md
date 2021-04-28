# Cài đặt

`git clone https://github.com/tungnnt/ssr-structure`  
`cd ssr-structure`  
`yarn install`

# Kiến thức cần biết

1. Nextjs và SSR

- [Nextjs cơ bản](https://nextjs.org/learn/basics/create-nextjs-app)
- [Phân biệt các cách để SSR trong Nextjs](https://binyamin.medium.com/static-server-side-and-client-side-rendering-with-nextjs-d5e1c61b24bd)

2. Antd

- [Ant design components](https://ant.design/components/overview/)

# Lập trình

`yarn dev`

- Cấu trúc thư mục `pages` theo hướng dẫn như trong [Nextjs cơ bản](https://nextjs.org/learn/basics/create-nextjs-app)
- Các component nhỏ để trong `src/components`, một trang trong thư mục `pages` được hình thành dựa trên các component nhỏ
- Để thêm css cho một trang, hoặc một component, thì tạo một file dạng `[component-name].style.scss` trong cùng thư mục với trang, hoặc component đó, sử hàm `rem(px)` (được định nghĩa trong `src/components/scss/_variables.scss`) để style kích cỡ của component giống như Figma, cuối cùng, import file scss vừa tạo vào trong file `src/components/scss/main.scss`
- Xem cách sử dụng các component, cách style component bằng class, và i18n trong ```pages/index.tsx```
