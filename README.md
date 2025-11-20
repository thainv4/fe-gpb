# Bạch Mai LIS GPB

Hệ thống quản lý thông tin phòng xét nghiệm Bạch Mai GPB được xây dựng với Next.js 14, TypeScript, và Shadcn UI.

## 🚀 Tính năng

- **Xác thực người dùng**: Đăng nhập/đăng xuất với NextAuth.js
- **Quản lý danh mục**: CRUD operations cho danh mục xét nghiệm
- **Dashboard**: Giao diện tổng quan với thống kê
- **Responsive Design**: Tương thích với mọi thiết bị
- **Modern UI**: Sử dụng Shadcn UI và Tailwind CSS

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Library**: Shadcn UI, Tailwind CSS, Radix UI
- **State Management**: Zustand
- **Data Fetching**: TanStack React Query
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form + Zod
- **Icons**: Lucide React

## 📦 Cài đặt

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd gpb_fe
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình environment variables**:
   ```bash
   cp env.example .env.local
   ```
   
   Chỉnh sửa `.env.local` với thông tin phù hợp:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   NEXT_PUBLIC_BACKEND_API_URL=http://192.168.68.209:3333/api/v1
   ```

4. **Chạy development server**:
   ```bash
   npm run dev
   ```

5. **Mở trình duyệt**: http://localhost:3000

## 🏗️ Cấu trúc dự án

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── categories/        # Category management
│   └── settings/          # Settings page
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   ├── auth-wizard/      # Authentication components
│   ├── category-management/ # Category components
│   └── layout/           # Layout components
├── lib/                  # Utilities and configurations
│   ├── api/              # API client
│   ├── stores/           # Zustand stores
│   ├── auth.ts           # NextAuth configuration
│   └── utils.ts          # Utility functions
└── types/                # TypeScript type definitions
```

## 🔧 Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run lint` - Chạy ESLint
- `npm run type-check` - Kiểm tra TypeScript

## 🔗 API Integration

Dự án kết nối với backend API tại: `http://192.168.68.209:3333/api/v1`

### Endpoints chính:
- `POST /auth/login` - Đăng nhập
- `GET /auth/profile` - Lấy thông tin user
- `GET /categories` - Lấy danh sách danh mục
- `POST /categories` - Tạo danh mục mới
- `PUT /categories/:id` - Cập nhật danh mục
- `DELETE /categories/:id` - Xóa danh mục

## 🎨 UI Components

Sử dụng Shadcn UI với custom theme cho Bạch Mai LIS:
- **Primary Color**: Medical Blue (#0ea5e9)
- **Design System**: Consistent với brand Bạch Mai
- **Accessibility**: Tuân thủ WCAG guidelines

## 🔐 Authentication

- Sử dụng NextAuth.js với Credentials Provider
- JWT token được lưu trong localStorage
- Session management với Zustand store
- Protected routes với middleware

## 📱 Responsive Design

- **Mobile-first approach**
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly**: Optimized cho mobile devices

## 🚀 Deployment

### Vercel (Recommended)
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

### Manual Deployment
```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 📞 Support

Liên hệ team phát triển Bạch Mai LIS GPB để được hỗ trợ.

---

**Bạch Mai Hospital** - Hệ thống quản lý thông tin phòng xét nghiệm GPB
