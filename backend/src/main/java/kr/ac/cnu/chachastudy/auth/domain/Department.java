package kr.ac.cnu.chachastudy.auth.domain;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Department {

    // 인문대학
    KOREAN_LITERATURE("국어국문학과"),
    ENGLISH_LITERATURE("영어영문학과"),
    GERMAN_LITERATURE("독어독문학과"),
    FRENCH_LITERATURE("불어불문학과"),
    CHINESE_LITERATURE("중어중문학과"),
    JAPANESE_LITERATURE("일어일문학과"),
    CLASSICAL_CHINESE("한문학과"),
    LINGUISTICS("언어학과"),
    HISTORY("사학과"),
    KOREAN_HISTORY("국사학과"),
    ARCHAEOLOGY("고고학과"),
    PHILOSOPHY("철학과"),

    // 사회과학대학
    SOCIOLOGY("사회학과"),
    LIBRARY_INFORMATION("문헌정보학과"),
    PSYCHOLOGY("심리학과"),
    MEDIA_INFORMATION("언론정보학과"),
    SOCIAL_WELFARE("사회복지학과"),
    POLITICAL_DIPLOMACY("정치외교학과"),
    PUBLIC_ADMINISTRATION("행정학부"),
    URBAN_AUTONOMY("도시·자치융합학과"),

    // 자연과학대학
    MATHEMATICS("수학과"),
    STATISTICS("정보통계학과"),
    PHYSICS("물리학과"),
    ASTRONOMY("천문우주과학과"),
    CHEMISTRY("화학과"),
    BIOCHEMISTRY("생화학과"),
    GEOLOGY("지질환경과학과"),
    MARINE_ENVIRONMENT("해양환경과학과"),
    SPORTS_SCIENCE("스포츠과학과"),
    DANCE("무용학과"),
    SEMICONDUCTOR_CONVERGENCE("반도체융합학과"),

    // 경상대학
    ECONOMICS("경제학과"),
    BUSINESS("경영학부"),
    INTERNATIONAL_TRADE("무역학과"),
    ASIA_BUSINESS("아시아비즈니스국제학과"),

    // 공과대학
    ARCHITECTURE("건축학과"),
    ARCHITECTURAL_ENGINEERING("건축공학과"),
    CIVIL_ENGINEERING("토목공학과"),
    ENVIRONMENTAL_ENGINEERING("환경공학과"),
    MECHANICAL_ENGINEERING("기계공학부"),
    MECHATRONICS("메카트로닉스공학과"),
    NAVAL_ARCHITECTURE("선박해양공학과"),
    AEROSPACE_ENGINEERING("항공우주공학과"),
    ELECTRICAL_ENGINEERING("전기공학과"),
    ELECTRONIC_ENGINEERING("전자공학과"),
    RADIO_COMMUNICATION("전파정보통신공학과"),
    COMPUTER_SCIENCE("컴퓨터융합학부"),
    ARTIFICIAL_INTELLIGENCE("인공지능학과"),
    MATERIALS_ENGINEERING("신소재공학과"),
    APPLIED_CHEMICAL_ENGINEERING("응용화학공학과"),
    ORGANIC_MATERIALS("유기재료공학과"),
    AUTONOMOUS_NAVIGATION("자율운항시스템공학과"),
    ENERGY_ENGINEERING("에너지공학과"),
    ICT_CONVERGENCE("정보통신융합학부"),

    // 농업생명과학대학
    PLANT_RESOURCES("식물자원학과"),
    HORTICULTURE("원예학과"),
    FOREST_ENVIRONMENT("산림환경자원학과"),
    ENVIRONMENTAL_MATERIALS("환경소재공학과"),
    ANIMAL_RESOURCES("동물자원생명과학과"),
    ANIMAL_BIOSYSTEM("동물바이오시스템과학과"),
    APPLIED_BIOLOGY("응용생물학과"),
    BIO_ENVIRONMENT_CHEMISTRY("생물환경화학과"),
    FOOD_ENGINEERING("식품공학과"),
    REGIONAL_ENVIRONMENT("지역환경토목학과"),
    SMART_AGRICULTURE("스마트농업시스템기계공학과"),
    AGRICULTURAL_ECONOMICS("농업경제학과"),

    // 약학대학
    PHARMACY("약학과"),

    // 의과대학
    MEDICINE_PRE("의예과"),
    MEDICINE("의학과"),

    // 수의과대학
    VETERINARY_PRE("수의예과"),
    VETERINARY("수의학과"),

    // 생활과학대학
    CLOTHING("의류학과"),
    FOOD_NUTRITION("식품영양학과"),
    CONSUMER_STUDIES("소비자학과"),

    // 예술대학
    MUSIC("음악과"),
    ORCHESTRA("관현악과"),
    PAINTING("회화과"),
    SCULPTURE("조소과"),
    DESIGN("디자인창의학과"),

    // 사범대학
    KOREAN_EDUCATION("국어교육과"),
    ENGLISH_EDUCATION("영어교육과"),
    MATH_EDUCATION("수학교육과"),
    EDUCATION("교육학과"),
    PHYSICAL_EDUCATION("체육교육과"),
    CONSTRUCTION_ENGINEERING_EDUCATION("건설공학교육과"),
    MECHANICAL_ENGINEERING_EDUCATION("기계공학교육과"),
    ELECTRICAL_ENGINEERING_EDUCATION("전기전자통신공학교육과"),
    CHEMICAL_ENGINEERING_EDUCATION("화학공학교육과"),
    TECHNOLOGY_EDUCATION("기술교육과"),

    // 간호대학
    NURSING("간호학과"),

    // 생명시스템과학대학
    BIOLOGICAL_SCIENCE("생물과학과"),
    MICROBIOLOGY_MOLECULAR("미생물·분자생명과학과"),
    LIFE_INFORMATION("생명정보융합학과"),

    // 지식융합학부
    HUMANITIES_SOCIAL("인문사회학과"),
    LEADERSHIP_ORGANIZATION("리더십과 조직과학과"),
    PUBLIC_SAFETY("공공안전학과"),

    // 국가안보융합학부
    NATIONAL_SECURITY("국토안보학전공"),
    MARITIME_SECURITY("해양안보학전공"),

    // 국제학부
    INTERNATIONAL_STUDIES("국제학부"),

    // 창의융합대학
    CREATIVE_CONVERGENCE("창의융합대학"),

    OTHER("기타");

    private final String label;
}
