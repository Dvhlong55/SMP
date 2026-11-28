// ============================================================================
//  ROAD2VMO TEST — EXAM DATA & FEATURE FLAGS (SMP-MATH)
//  Hướng dẫn vận hành:
//  1. Điền nội dung đề thi (LaTeX) vào trường `statement` của từng bài,
//     hoặc gắn link PDF đề thi vào `statementPdfUrl`.
//  2. Khi mới phát đề, giữ `isSolutionPublished: false`.
//  3. Sau buổi sửa bài cho lớp, đổi `isSolutionPublished: true` và điền
//     `rubric` + `solutionPdfUrl` để mở khóa Barem tự chấm điểm.
// ============================================================================

window.ROAD2VMO_EXAMS = {
    "1": {
        round: 1,
        id: "road2vmo-01",
        title: "Road2VMO Test — Lần 1",
        subtitle: "Kỳ thi thử VMO trực tuyến (Đợt 1)",
        classroomUrl: "https://classroom.google.com/c/ODYxMTkzMzQwOTYx/a/ODkzODM0Mzc2Mjgy/details",
        fileNamingRule: "HoTen.pdf",
        scheduleNote: "Học sinh lớp VMO SMP bắt buộc hoàn thành và nộp bài vào Thứ 5. Thí sinh tự do có thể làm bài bất cứ lúc nào.",
        isSolutionPublished: false,
        solutionReleaseNote: "Đáp án & Barem tự chấm điểm Lần 1 sẽ được mở khóa sau buổi sửa bài trực tiếp của lớp VMO SMP.",
        sessions: {
            morning: {
                key: "morning",
                label: "Ngày 1",
                vmoMinutes: 180,
                solutionPdfUrl: "",
                problems: [
                    {
                        code: "Bài 1",
                        maxScore: 7,
                        statement: "Đề thi <b>Road2VMO Test — Lần 1 (Buổi Sáng)</b> đang được cập nhật trực tiếp tại đây. Học sinh có thể bấm giờ làm bài theo đề đã phát trên lớp hoặc file đề đính kèm của giáo viên, sau đó nộp bài qua cổng Google Classroom.",
                        rubric: [
                            { step: "Ý 1: Thiết lập điều kiện / nhận xét mở đầu", points: 2.0 },
                            { step: "Ý 2: Chứng minh tính chất trung gian", points: 2.5 },
                            { step: "Ý 3: Hoàn tất lập luận và kết luận", points: 2.5 }
                        ]
                    },
                    {
                        code: "Bài 2",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 2 (Buổi Sáng — Lần 1)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Xây dựng mô hình / biến đổi tương đương", points: 2.0 },
                            { step: "Ý 2: Xử lý trường hợp chính", points: 3.0 },
                            { step: "Ý 3: Kiểm tra biên và kết luận", points: 2.0 }
                        ]
                    },
                    {
                        code: "Bài 3",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 3 (Buổi Sáng — Lần 1)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Phân tích cấu hình / bất biến", points: 2.5 },
                            { step: "Ý 2: Chứng minh chặn trên hoặc đẳng thức đếm", points: 2.5 },
                            { step: "Ý 3: Chỉ ra dấu bằng / cấu hình thỏa mãn", points: 2.0 }
                        ]
                    }
                ]
            },
            afternoon: {
                key: "afternoon",
                label: "Ngày 2",
                vmoMinutes: 180,
                solutionPdfUrl: "",
                problems: [
                    {
                        code: "Bài 4",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 4 (Buổi Chiều — Lần 1)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Đánh giá số học / tính chia hết cơ bản", points: 2.0 },
                            { step: "Ý 2: Sử dụng định lý / bổ đề cốt lõi", points: 3.0 },
                            { step: "Ý 3: Kết luận đầy đủ các nghiệm", points: 2.0 }
                        ]
                    },
                    {
                        code: "Bài 5",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 5 (Buổi Chiều — Lần 1)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Chứng minh các điểm cùng thuộc đường tròn / thẳng hàng", points: 3.0 },
                            { step: "Ý 2: Hoàn tất chứng minh tính chất hình học", points: 4.0 }
                        ]
                    },
                    {
                        code: "Bài 6",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 6 (Buổi Chiều — Lần 1)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Tìm cấu hình cực trị / giá trị tới hạn", points: 3.0 },
                            { step: "Ý 2: Chứng minh tính tối ưu", points: 4.0 }
                        ]
                    }
                ]
            }
        }
    },
    "2": {
        round: 2,
        id: "road2vmo-02",
        title: "Road2VMO Test — Lần 2",
        subtitle: "Kỳ thi thử VMO trực tuyến (Đợt 2)",
        classroomUrl: "https://classroom.google.com/c/ODYxMTkzMzQwOTYx/a/OTAxNDA5NTE2MzQy/details",
        fileNamingRule: "HoTen.pdf",
        scheduleNote: "Học sinh lớp VMO SMP bắt buộc hoàn thành và nộp bài vào Thứ 5. Thí sinh tự do có thể làm bài bất cứ lúc nào.",
        isSolutionPublished: false,
        solutionReleaseNote: "Đáp án & Barem tự chấm điểm Lần 2 sẽ được mở khóa sau buổi sửa bài trực tiếp của lớp VMO SMP.",
        sessions: {
            morning: {
                key: "morning",
                label: "Ngày 1",
                vmoMinutes: 180,
                solutionPdfUrl: "",
                problems: [
                    {
                        code: "Bài 1",
                        maxScore: 7,
                        statement: "Đề thi <b>Road2VMO Test — Lần 2 (Buổi Sáng)</b> đang được cập nhật trực tiếp tại đây. Học sinh có thể bấm giờ làm bài theo đề đã phát trên lớp hoặc file đề đính kèm của giáo viên, sau đó nộp bài qua cổng Google Classroom.",
                        rubric: [
                            { step: "Ý 1: Thiết lập phương trình / bất đẳng thức trung gian", points: 2.0 },
                            { step: "Ý 2: Chứng minh phần chính", points: 3.0 },
                            { step: "Ý 3: Kết luận", points: 2.0 }
                        ]
                    },
                    {
                        code: "Bài 2",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 2 (Buổi Sáng — Lần 2)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Nhận xét bước đầu", points: 2.5 },
                            { step: "Ý 2: Chứng minh hoàn chỉnh", points: 4.5 }
                        ]
                    },
                    {
                        code: "Bài 3",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 3 (Buổi Sáng — Lần 2)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Xây dựng song ánh / công thức truy hồi", points: 3.0 },
                            { step: "Ý 2: Tính toán và kết luận", points: 4.0 }
                        ]
                    }
                ]
            },
            afternoon: {
                key: "afternoon",
                label: "Ngày 2",
                vmoMinutes: 180,
                solutionPdfUrl: "",
                problems: [
                    {
                        code: "Bài 4",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 4 (Buổi Chiều — Lần 2)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Phân tích điều kiện số học", points: 2.5 },
                            { step: "Ý 2: Hoàn tất chứng minh", points: 4.5 }
                        ]
                    },
                    {
                        code: "Bài 5",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 5 (Buổi Chiều — Lần 2)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Dựng điểm phụ / góc định hướng", points: 3.0 },
                            { step: "Ý 2: Chứng minh tính chất đích", points: 4.0 }
                        ]
                    },
                    {
                        code: "Bài 6",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 6 (Buổi Chiều — Lần 2)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Đánh giá chặn", points: 3.0 },
                            { step: "Ý 2: Xây dựng ví dụ tối ưu", points: 4.0 }
                        ]
                    }
                ]
            }
        }
    },
    "3": {
        round: 3,
        id: "road2vmo-03",
        title: "Road2VMO Test — Lần 3",
        subtitle: "Kỳ thi thử VMO trực tuyến (Đợt 3)",
        classroomUrl: "https://classroom.google.com/c/ODYxMTkzMzQwOTYx/a/ODkzODM0NzI2MjA3/details",
        fileNamingRule: "HoTen.pdf",
        scheduleNote: "Học sinh lớp VMO SMP bắt buộc hoàn thành và nộp bài vào Thứ 5. Thí sinh tự do có thể làm bài bất cứ lúc nào.",
        isSolutionPublished: false,
        solutionReleaseNote: "Đáp án & Barem tự chấm điểm Lần 3 sẽ được mở khóa sau buổi sửa bài trực tiếp của lớp VMO SMP.",
        sessions: {
            morning: {
                key: "morning",
                label: "Ngày 1",
                vmoMinutes: 180,
                solutionPdfUrl: "",
                problems: [
                    {
                        code: "Bài 1",
                        maxScore: 7,
                        statement: "Đề thi <b>Road2VMO Test — Lần 3 (Buổi Sáng)</b> đang được cập nhật trực tiếp tại đây. Học sinh có thể bấm giờ làm bài theo đề đã phát trên lớp hoặc file đề đính kèm của giáo viên, sau đó nộp bài qua cổng Google Classroom.",
                        rubric: [
                            { step: "Ý 1: Phân tích giả thiết", points: 2.0 },
                            { step: "Ý 2: Chứng minh phần chính", points: 3.0 },
                            { step: "Ý 3: Kết luận", points: 2.0 }
                        ]
                    },
                    {
                        code: "Bài 2",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 2 (Buổi Sáng — Lần 3)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Biến đổi hàm / dãy số", points: 3.0 },
                            { step: "Ý 2: Hoàn tất lập luận", points: 4.0 }
                        ]
                    },
                    {
                        code: "Bài 3",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 3 (Buổi Sáng — Lần 3)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Thiết lập bất biến / đếm", points: 3.0 },
                            { step: "Ý 2: Kết luận", points: 4.0 }
                        ]
                    }
                ]
            },
            afternoon: {
                key: "afternoon",
                label: "Ngày 2",
                vmoMinutes: 180,
                solutionPdfUrl: "",
                problems: [
                    {
                        code: "Bài 4",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 4 (Buổi Chiều — Lần 3)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Khảo sát đồng dư / ước nguyên tố", points: 3.0 },
                            { step: "Ý 2: Chứng minh hoàn chỉnh", points: 4.0 }
                        ]
                    },
                    {
                        code: "Bài 5",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 5 (Buổi Chiều — Lần 3)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Chứng minh bổ đề hình học", points: 3.0 },
                            { step: "Ý 2: Suy ra kết quả bài toán", points: 4.0 }
                        ]
                    },
                    {
                        code: "Bài 6",
                        maxScore: 7,
                        statement: "Nội dung <b>Bài 6 (Buổi Chiều — Lần 3)</b> sẽ hiển thị tại đây khi giáo viên cập nhật đề vào <code>core/data/road2vmo-exams.js</code>.",
                        rubric: [
                            { step: "Ý 1: Chỉ ra nghiệm / cấu hình", points: 3.0 },
                            { step: "Ý 2: Chứng minh duy nhất / tối ưu", points: 4.0 }
                        ]
                    }
                ]
            }
        }
    }
};
