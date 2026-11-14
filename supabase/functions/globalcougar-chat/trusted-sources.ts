export type TrustedSource = {
  id: string;
  title: string;
  url: string;
  authority: string;
  topics: string[];
  keywords: string[];
  negativeKeywords?: string[];
  indexedText?: string;
  preferLive?: boolean;
};

export const TRUSTED_HOSTS = new Set([
  "www.uscis.gov",
  "studyinthestates.dhs.gov",
  "travel.state.gov",
  "iss.byu.edu",
  "policy.byu.edu",
  "catalog.byu.edu",
  "www.byu.edu",
  "www.churchofjesuschrist.org",
  "newsroom.churchofjesuschrist.org",
  "kr.churchofjesuschrist.org",
  "www.ecfr.gov",
]);

export const TRUSTED_SOURCES: TrustedSource[] = [
  {
    id: "byu-isss-advisor-assignments",
    title: "BYU ISSS Contact Us and Advisor Assignments",
    url: "https://iss.byu.edu/contact-us",
    authority: "BYU International Student and Scholar Services",
    topics: ["assigned isss advisor", "international student advisor", "advisor by last name", "isss contact"],
    keywords: ["advisor", "adviser", "assigned advisor", "my advisor", "last name", "family name", "surname", "담당자", "어드바이저", "상담사", "성씨", "성", "asesor", "asesora", "apellido", "conseiller", "berater", "顾问", "姓", "アドバイザー", "苗字"],
    preferLive: true,
    indexedText: `BYU ISSS CONTACT US AND ADVISOR ASSIGNMENTS
Advisor assignments are based on the first letter of the student's family/last name.
Rob Llewellyn, Advisor, rob_llewellyn@byu.edu: last names A-D.
Cristi Johnson, Advisor, cristi.johnson@byu.edu: last names E-J.
The K-O advisor position is currently vacant. Students in K-O may schedule with any of the other ISSS advisors; do not assign a specific advisor for this range.
Landon Tooke, Advisor, landon.tooke@byu.edu: last names P-U.
Sam Brown, Director, sam_brown@byu.edu: last names V-Z.
ISSS office: iss@byu.edu, (801) 422-2695, 2400 WSC.
Official source: https://iss.byu.edu/contact-us`,
  },
  {
    id: "byu-isss-cpt-application",
    title: "BYU ISSS Curricular Practical Training Application Information",
    url: "https://iss.byu.edu/00000172-e226-df6e-a3f7-ef6e55990000/cpt-information-internship-coordinator-cpt-verification-pdf",
    authority: "BYU International Student and Scholar Services",
    topics: ["curricular practical training", "cpt", "off-campus employment", "internship authorization", "cpt eligibility", "transfer student cpt"],
    keywords: ["cpt", "curricular practical training", "off-campus", "off campus", "internship", "one academic year", "transfer student", "transferred", "graduate student", "eligibility", "실무 연수", "교외 취업", "인턴십", "편입생", "전학생", "entrenamiento práctico curricular", "fuera del campus", "estudiante transferido", "实习训练", "校外工作"],
    indexedText: `CURRICULAR PRACTICAL TRAINING APPLICATION INFORMATION
Curricular Practical Training (CPT) is supervised practical work experience directly related to your major prior to the completion of your academic program.
ELIGIBILITY REQUIREMENT
Full-time enrollment at present degree level for one academic year (eight months); however, if you transferred to BYU without changing education levels, having previously met the enrollment requirement, you will be eligible upon checking in with ISSS. If you are a new graduate student in a degree program which mandates CPT during the first two semesters, you will be granted an exception and may begin CPT immediately. A student in an integrated program is not eligible for CPT after completing the last undergraduate year.
APPLICATION PROCESS
Obtain a qualifying job offer letter, review it with the academic department's internship coordinator, complete the Internship Coordinator CPT Verification form, enroll in the appropriate internship course, and submit the CPT approval request and required documents to ISSS at least three working days before the expected start date. Upon ISSS notification, pick up the new CPT Form I-20.
REQUIREMENTS
Work only between the dates listed on the Form I-20; follow the approved part-time or full-time hours; remain enrolled in the internship course; renew CPT authorization for every semester and term of off-campus work; and maintain a valid Form I-20 and passport. One year or more of full-time CPT disqualifies a student from Optional Practical Training after graduation.`,
  },
  {
    id: "byu-isss-employment",
    title: "BYU ISSS Employment",
    url: "https://iss.byu.edu/employment",
    authority: "BYU International Student and Scholar Services",
    topics: ["employment", "f-1 employment", "work authorization", "student job"],
    keywords: ["cpt", "opt", "employment", "work", "job", "internship", "취업", "근무", "인턴십", "empleo", "trabajo", "estágio", "emprego", "工作", "就业", "就労", "emploi", "arbeit", "работ"],
  },
  {
    id: "byu-isss-on-campus-employment",
    title: "BYU ISSS F-1 On-Campus Employment",
    url: "https://iss.byu.edu/f-1-on-campus-employment",
    authority: "BYU International Student and Scholar Services",
    topics: ["f-1", "on-campus employment", "work hours", "student job"],
    keywords: ["on-campus", "on campus", "work hours", "20 hours", "campus job", "교내", "근무 시간", "trabajo en el campus", "horas de trabajo", "校园工作", "校内", "campusarbeit"],
    negativeKeywords: ["cpt", "curricular practical training", "off-campus", "off campus", "교외", "fuera del campus", "校外"],
  },
  {
    id: "byu-policy-honor-code",
    title: "Church Educational System Honor Code",
    url: "https://policy.byu.edu/view/church-educational-system-honor-code",
    authority: "Brigham Young University",
    topics: ["honor code", "student conduct", "word of wisdom", "coffee", "alcohol", "tobacco"],
    keywords: ["honor code", "word of wisdom", "coffee", "tea", "alcohol", "tobacco", "명예 규범", "아너 코드", "지혜의 말씀", "커피", "차", "술", "담배", "código de honor", "palabra de sabiduría", "café", "codigo de honra", "咖啡", "荣誉准则", "校則", "コーヒー", "code d'honneur", "кафе", "кодекс чести"],
  },
  {
    id: "byu-policy-student-standing",
    title: "BYU Student Standing Policy",
    url: "https://policy.byu.edu/view/student-standing-policy",
    authority: "Brigham Young University",
    topics: ["student standing", "ecclesiastical endorsement", "enrollment", "graduation"],
    keywords: ["student standing", "ecclesiastical endorsement", "endorsement", "good standing", "학생 신분", "교회 추천서", "재학", "respaldo eclesiástico", "aval eclesiástico", "教会推荐", "推薦状"],
  },
  {
    id: "byu-policy-academic-honesty",
    title: "BYU Academic Honesty Policy",
    url: "https://policy.byu.edu/view/academic-honesty-policy",
    authority: "Brigham Young University",
    topics: ["academic honesty", "plagiarism", "cheating", "academic misconduct"],
    keywords: ["academic honesty", "plagiarism", "cheating", "citation", "표절", "부정행위", "학업 정직", "plagio", "trampa", "抄袭", "剽窃", "plagiat", "плагиат"],
  },
  {
    id: "byu-policy-directory",
    title: "BYU University Policies",
    url: "https://policy.byu.edu/",
    authority: "Brigham Young University",
    topics: ["byu policy", "university rules", "student policy"],
    keywords: ["byu policy", "university policy", "school rule", "학교 정책", "학교 규칙", "política de byu", "regla universitaria", "大学政策", "大学規則", "politique de byu"],
  },
  {
    id: "byu-academic-catalog",
    title: "BYU Academic Catalog",
    url: "https://catalog.byu.edu/",
    authority: "Brigham Young University",
    topics: ["academic catalog", "major", "course", "degree", "graduation requirement"],
    keywords: ["catalog", "major", "course", "degree", "credit", "graduation", "전공", "과목", "학위", "학점", "졸업", "carrera", "curso", "título", "专业", "课程", "専攻", "cours", "studiengang"],
  },
  {
    id: "uscis-opt",
    title: "USCIS Optional Practical Training for F-1 Students",
    url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students",
    authority: "U.S. Citizenship and Immigration Services",
    topics: ["opt", "f-1", "employment authorization", "ead", "form i-765"],
    keywords: ["opt", "optional practical training", "i-765", "ead", "employment authorization", "취업 허가", "선택적 실무 연수", "entrenamiento práctico opcional", "autorización de empleo", "实习许可", "選択実習"],
  },
  {
    id: "uscis-students-exchange-visitors",
    title: "USCIS Students and Exchange Visitors",
    url: "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors",
    authority: "U.S. Citizenship and Immigration Services",
    topics: ["f-1", "student status", "employment authorization", "uscis"],
    keywords: ["uscis", "f-1", "student status", "exchange visitor", "visa status", "학생 신분", "비자 신분", "estatus f-1", "学生身份", "在留資格"],
  },
  {
    id: "ecfr-f1-practical-training",
    title: "8 CFR 214.2(f)(10) Practical Training",
    url: "https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/subpart-A/section-214.2#p-214.2(f)(10)",
    authority: "Electronic Code of Federal Regulations",
    topics: ["cpt regulation", "curricular practical training", "f-1 practical training", "8 cfr 214.2", "one academic year"],
    keywords: ["cpt", "curricular practical training", "practical training", "one full academic year", "dso authorization", "form i-20", "regulation", "연방 규정", "실무 연수", "entrenamiento práctico curricular", "reglamento federal"],
    indexedText: `8 CFR 214.2(f)(10) PRACTICAL TRAINING
The regulation permits practical training for an F-1 student who has been lawfully enrolled full time at an approved SEVP-certified college, university, conservatory, or seminary for one full academic year. The position must be directly related to the student's major area of study.
8 CFR 214.2(f)(10)(i) CURRICULAR PRACTICAL TRAINING
CPT must be an integral part of an established curriculum, such as alternative work/study, an internship, cooperative education, or another required internship or practicum. A DSO authorizes CPT. Graduate programs that require immediate CPT participation are excepted from the one-academic-year requirement.
A student may not start CPT until the DSO has updated SEVIS and returned a properly endorsed Form I-20 showing the employer, location, whether the training is full-time or part-time, and the authorized start and end dates. One year or more of full-time CPT makes a student ineligible for post-completion OPT.`,
  },
  {
    id: "dhs-training-opportunities",
    title: "DHS Study in the States Training Opportunities",
    url: "https://studyinthestates.dhs.gov/students/training-opportunities-in-the-united-states",
    authority: "U.S. Department of Homeland Security",
    topics: ["cpt", "opt", "stem opt", "practical training", "f-1"],
    keywords: ["cpt", "opt", "stem opt", "practical training", "curricular practical training", "실무 연수", "교육 과정 실습", "entrenamiento práctico", "treinamento prático", "实习训练", "実務訓練"],
  },
  {
    id: "dhs-maintaining-status",
    title: "DHS Study in the States Maintaining Status",
    url: "https://studyinthestates.dhs.gov/students/maintaining-status",
    authority: "U.S. Department of Homeland Security",
    topics: ["maintaining status", "f-1 status", "full course of study", "sevis"],
    keywords: ["maintain status", "maintaining status", "full course", "sevis", "신분 유지", "풀타임 등록", "mantener estatus", "mantener el estatus", "维持身份", "身分維持"],
  },
  {
    id: "state-department-student-visa",
    title: "U.S. Department of State Student Visa",
    url: "https://travel.state.gov/content/travel/en/us-visas/study/student-visa.html",
    authority: "U.S. Department of State",
    topics: ["student visa", "f-1 visa", "visa interview", "embassy", "consulate"],
    keywords: ["student visa", "f-1 visa", "visa interview", "embassy", "consulate", "학생 비자", "비자 인터뷰", "대사관", "비자 de estudiante", "visa estudiantil", "学生签证", "学生ビザ"],
  },
  {
    id: "church-style-guide",
    title: "Church Newsroom Style Guide",
    url: "https://newsroom.churchofjesuschrist.org/style-guide",
    authority: "The Church of Jesus Christ of Latter-day Saints",
    topics: ["official church name", "church terminology", "style guide"],
    keywords: ["official name", "church name", "latter-day saints", "mormon church", "공식 명칭", "교회 이름", "후기 성도", "nombre oficial", "nome oficial", "官方名称", "正式名称", "nom officiel"],
  },
  {
    id: "church-word-of-wisdom",
    title: "Word of Wisdom",
    url: "https://www.churchofjesuschrist.org/study/manual/gospel-topics/word-of-wisdom?lang=eng",
    authority: "The Church of Jesus Christ of Latter-day Saints",
    topics: ["word of wisdom", "church teaching", "coffee", "tea", "alcohol", "tobacco"],
    keywords: ["word of wisdom", "coffee", "tea", "alcohol", "tobacco", "지혜의 말씀", "커피", "차", "술", "담배", "palabra de sabiduría", "palavra de sabedoria", "智慧语", "知恵の言葉", "parole de sagesse"],
  },
];

