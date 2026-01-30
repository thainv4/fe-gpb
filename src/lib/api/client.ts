const API_BASE_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL ||
    "http://localhost:8000/api/v1";

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    status?: number;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    fullName: string;
}

export interface RegisterResponse {
    user: {
        id: string;
        username: string;
        email: string;
        fullName: string;
        isActive: boolean;
    };
    accessToken: string;
    refreshToken: string;
}

export interface RegisterWithProfileRequest {
    // User fields (required)
    username: string;
    password: string;
    fullName: string;
    
    // Profile fields (optional)
    provinceId?: string;
    wardId?: string;
    address?: string;
    departmentId?: string;
    position?: string;
    employeeCode?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER';
    avatar?: string;
    mappedUsername?: string;
    mappedPassword?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface LoginResponse {
    user: {
        id: string;
        username: string;
        email: string | null;
        fullName: string;
        role: string;
        isActive: boolean | number;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
    hisTokenCode?: string;
    hisRenewCode?: string;
    hisUserInfo?: {
        loginName: string;
        userName: string;
        applicationCode: string;
        gCode: string;
        email: string;
        mobile: string;
    };
    hisSessionInfo?: {
        validAddress: string;
        loginTime: string;
        expireTime: string;
        loginAddress: string;
    };
    hisRoles?: Array<{
        RoleCode: string;
        RoleName: string;
    }>;
}

export interface HisTokenResponse {
    tokenCode: string;
    renewCode?: string;
    userLoginName: string;
    userName: string;
    userEmail: string;
    userMobile: string;
    userGCode: string;
    applicationCode: string;
    loginTime: string;
    expireTime: string;
    minutesUntilExpire?: number;
    roles?: Array<{
        roleCode?: string;
        roleName?: string;
        RoleCode?: string;
        RoleName?: string;
    }>;
}

export interface HisDirectLoginResponse {
    message: string;
    hisToken: {
        tokenCode: string;
        userLoginName: string;
        userName: string;
        userEmail: string;
        userMobile: string;
        userGCode: string;
        applicationCode: string;
        loginTime: string;
        expireTime: string;
        minutesUntilExpire: number;
        roles: Array<{
            roleCode?: string;
            roleName?: string;
            RoleCode?: string;
            RoleName?: string;
        }>;
    };
    accessToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface HisTokenValidationResponse {
    message: string;
    user: {
        loginName: string;
        userName: string;
        email: string;
        mobile: string;
        gCode: string;
        applicationCode: string;
        roles: Array<{
            roleCode: string;
            roleName: string;
        }>;
    };
    token: {
        tokenCode: string;
        loginTime: string;
        expireTime: string;
        minutesUntilExpire: number;
        isExpired: boolean;
        isExpiringSoon: boolean;
    };
}

export interface HisUserInfo {
    loginName: string;
    userName: string;
    email: string;
    mobile: string;
    gCode: string;
    applicationCode: string;
    roles: Array<{
        roleCode: string;
        roleName: string;
    }>;
    loginTime: string;
    expireTime: string;
    minutesUntilExpire: number;
}

export interface HisTokenStatus {
    isValid: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    minutesUntilExpire: number;
    userLoginName: string;
    userName: string;
    loginTime: string;
    expireTime: string;
}

export interface HisPacsUpdateResultApiData {
    IsCancel: boolean;
    BeginTime: number | null;
    EndTime: number | null;
    Description: string;
    Conclude: string;
    Note: string;
    ExecuteLoginname: string;
    ExecuteUsername: string;
    TechnicianLoginname: string;
    TechnicianUsername: string;
    MachineCode: string;
    NumberOfFilm: number | null;
}

export interface HisPacsUpdateResultRequest {
    ApiData: HisPacsUpdateResultApiData;
}

export interface HisApiCallRequest {
    endpoint: string;
    method?: string;
    data?: Record<string, unknown>;
    username?: string;
}

export interface Category {
    id: string;
    name: string;
    description?: string;
    code: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CategoryRequest {
    name: string;
    description?: string;
    code: string;
    isActive?: boolean;
}

export interface Province {
    id: string;
    provinceCode: string;
    provinceName: string;
    shortName: string | null;
    isActive: number;
    createdAt: string;
    updatedAt: string;
}

export interface ProvinceRequest {
    provinceCode: string;
    provinceName: string;
    shortName?: string;
    isActive?: boolean;
}

export interface ProvinceFilters {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface Ward {
    id: string;
    wardCode: string;
    wardName: string;
    shortName: string | null;
    provinceId: string;
    isActive: number;
    createdAt: string;
    updatedAt: string;
    sortOrder?: number;
    province?: Province;
}

export interface WardRequest {
    wardCode: string;
    wardName: string;
    shortName?: string;
    provinceId: string;
    sortOrder?: number;
    isActive?: boolean;
}

export interface WardFilters {
    search?: string;
    provinceId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface User {
    id: string;
    username: string;
    email: string;
    fullName: string;
    isActive: boolean;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    createdAt: string;
    updatedAt: string;
    // Profile relationship data (if populated)
    profile?: {
        provinceId?: string;
        wardId?: string;
        departmentId?: string;
        position?: string;
        employeeCode?: string;
        gender?: string;
        avatar?: string;
        mappedUsername?: string;
    };
    // Populated relationships
    province?: Province;
    ward?: Ward;
    department?: Department;
}

export interface UserRequest {
    username: string;
    email?: string;
    password?: string;
    fullName: string;
    isActive?: boolean;
    phoneNumber?: string;
    dateOfBirth?: string;
    address?: string;
    // Profile data (optional)
    provinceId?: string;
    wardId?: string;
    departmentId?: string;
    position?: string;
    employeeCode?: string;
    gender?: string;
    avatar?: string;
    mappedUsername?: string;
    mappedPassword?: string;
}

export interface UserFilters {
    search?: string;
    isActive?: boolean;
    provinceId?: string;
    wardId?: string;
    departmentId?: string;
    limit?: number;
    offset?: number;
}

export interface DepartmentType {
    id: string;
    typeCode: string;
    typeName: string;
    description?: string;
    isActiveFlag: number;
    createdAt: string;
    updatedAt: string;
}

export interface DepartmentTypeRequest {
    typeCode: string;
    typeName: string;
    description?: string;
    isActive?: boolean;
}

export interface DepartmentTypeFilters {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface Department {
    id: string;
    departmentCode: string;
    departmentName: string;
    branchId: string;
    headOfDepartment?: string;
    headNurse?: string;
    parentDepartmentId?: string;
    shortName?: string;
    departmentTypeId?: string;
    isActiveFlag: number;
    createdAt: string;
    updatedAt: string;
    branch?: Branch;
    departmentType?: DepartmentType;
    parentDepartment?: Department;
    subDepartments?: Department[];
}

export interface DepartmentRequest {
    departmentCode: string;
    departmentName: string;
    branchId: string;
    headOfDepartment?: string;
    headNurse?: string;
    parentDepartmentId?: string;
    shortName?: string;
    departmentTypeId?: string;
}

export interface DepartmentFilters {
    search?: string;
    branchId?: string;
    departmentTypeId?: string;
    parentDepartmentId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface ServiceGroup {
    id: string;
    serviceGroupCode: string;
    serviceGroupName: string;
    shortName?: string;
    mapping?: string;
    isActiveFlag: number;
    createdAt: string;
    updatedAt: string;
}

export interface ServiceGroupRequest {
    serviceGroupCode: string;
    serviceGroupName: string;
    shortName?: string;
    mapping?: string;
    isActive?: boolean;
}

export interface ServiceGroupFilters {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface UnitOfMeasure {
    id: string;
    unitOfMeasureCode: string;
    unitOfMeasureName: string;
    description?: string;
    mapping?: string;
    isActiveFlag: number;
    createdAt: string;
    updatedAt: string;
}

export interface UnitOfMeasureRequest {
    unitOfMeasureCode: string;
    unitOfMeasureName: string;
    description?: string;
    mapping?: string;
    isActive?: boolean;
}

export interface UnitOfMeasureFilters {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface Service {
    id: string;
    serviceCode: string;
    serviceName: string;
    shortName?: string;
    serviceGroupId?: string;
    unitOfMeasureId?: string;
    mapping?: string;
    numOrder?: number;
    currentPrice?: number;
    parentServiceId?: string;
    isActiveFlag: number;
    createdAt: string;
    updatedAt: string;
    serviceGroup?: ServiceGroup;
    unitOfMeasure?: UnitOfMeasure;
    parentService?: Service;
    subServices?: Service[];
}

export interface ServiceRequest {
    serviceCode: string;
    serviceName: string;
    shortName?: string;
    serviceGroupId?: string;
    unitOfMeasureId?: string;
    mapping?: string;
    numOrder?: number;
    currentPrice?: number;
    parentServiceId?: string;
    isActive?: boolean;
}

export interface ServiceFilters {
    search?: string;
    serviceGroupId?: string;
    unitOfMeasureId?: string;
    parentServiceId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface Room {
    id: string;
    roomCode: string;
    roomName: string;
    roomAddress?: string;
    departmentId: string;
    roomGroupId?: string;
    description?: string;
    isActive: boolean;
    sortOrder?: number;
    createdAt: string;
    updatedAt: string;
    department?: Department;
    roomGroup?: RoomGroup;
}

export interface RoomGroup {
    id: string;
    roomGroupCode: string;
    roomGroupName: string;
    displayName?: string;
    sortOrder?: number;
    isActive: boolean;
    version: number;
    createdAt: string;
    updatedAt: string;
}

export interface RoomGroupFilters {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface RoomRequest {
    roomCode: string;
    roomName: string;
    roomAddress?: string;
    departmentId: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
}

export interface RoomFilters {
    search?: string;
    departmentId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface SampleType {
    id: string;
    typeCode: string;
    typeName: string;
    shortName?: string;
    description?: string;
    sortOrder?: number;
    codePrefix?: string;
    codeWidth?: number;
    allowDuplicate?: boolean;
    resetPeriod?: 'DAILY' | 'MONTHLY' | 'YEARLY' | 'NEVER';
    codeGenerationRule?: string;
    isActiveFlag: number;
    isActive?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SampleTypeRequest {
    typeName: string;
    shortName?: string;
    description?: string;
    sortOrder?: number;
    codePrefix?: string | null;
    codeWidth?: number;
    allowDuplicate?: boolean;
    resetPeriod?: 'DAILY' | 'MONTHLY' | 'YEARLY' | 'NEVER';
}

export interface SampleTypeFilters {
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

export interface StainingMethod {
    id: string;
    methodName: string;
    createdAt: string | null;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string;
    version: number;
}

export interface StainingMethodRequest {
    methodName: string;
}

export interface StainingMethodFilters {
    limit?: number;
    offset?: number;
    search?: string;
}

export interface ResultTemplate {
    id: string;
    templateName: string;
    resultTemplateCode?: string;
    resultDescription: string;
    resultConclude: string;
    resultNote: string;
    resultComment?: string;
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface ResultTemplateRequest {
    templateName: string;
    resultTemplateCode?: string;
    resultDescription: string;
    resultConclude: string;
    resultNote: string;
    resultComment?: string;
}

export interface ResultTemplateFilters {
    keyword?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface SampleReceptionRequest {
    sampleTypeCode: string;
}

export interface SampleReceptionResponse {
    id?: string;
    receptionCode?: string;

    [key: string]: unknown;
}

export interface CreateSampleReceptionByPrefixRequest {
    prefix: string;
    sampleTypeId?: string;
    codeWidth: number;
    resetPeriod: 'MONTHLY' | 'DAILY' | 'YEARLY';
    allowDuplicate: boolean;
}

export interface Branch {
    id: string;
    branchCode: string;
    branchName: string;
    shortName?: string;
    provinceId: string;
    wardId: string;
    address: string;
    phoneNumber?: string;
    hospitalLevel?: string;
    representative?: string;
    bhytCode?: string;
    isActive: number;
    createdAt: string;
    updatedAt: string;
    province?: Province;
    ward?: Ward;
}

export interface BranchRequest {
    branchCode: string;
    branchName: string;
    shortName?: string;
    provinceId: string;
    wardId: string;
    address: string;
    phoneNumber?: string;
    hospitalLevel?: string;
    representative?: string;
    bhytCode?: string;
}

export interface BranchFilters {
    search?: string;
    provinceId?: string;
    wardId?: string;
    hospitalLevel?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
}

// Service Request related interfaces
export interface RoomInfo {
    id: number;
    code: string;
    name: string;
    lisRoomId?: string | null;
}

export interface DepartmentInfo {
    id: number;
    code: string;
    name: string;
    lisDepartmentId?: string | null;
}

export interface PatientInfo {
    id: number;
    code: string;
    name: string;
    dob: number; // yyyyMMddHHmmss format
    mobile?: string | null;
    phone?: string | null;
    cmndNumber?: string | null;
    cmndDate?: number | null; // yyyyMMddHHmmss format
    cmndPlace?: string | null;
    provinceCode?: string | null;
    provinceName?: string | null;
    lisProvinceId?: string | null;
    communeCode?: string | null;
    communeName?: string | null;
    lisWardId?: string | null;
    address?: string | null;
    genderId: number;
    genderName: string;
    careerName?: string | null;
    lisPatientId?: string | null;
}

export interface ServiceTest {
    id: string;
    testCode: string;
    testName: string;
    shortName?: string;
    description?: string | null;
    unitOfMeasureId?: string | null;
    unitOfMeasureCode?: string | null;
    unitOfMeasureName?: string | null;
    rangeText?: string | null;
    rangeLow?: number | null;
    rangeHigh?: number | null;
    mapping?: string | null;
    testOrder?: number | null;
    price?: number;
    isActive?: number;
    isActiveFlag?: number;
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
    version?: number;
}

export interface LisService {
    id: string;
    serviceCode: string;
    serviceName: string;
    shortName?: string;
    currentPrice?: number;
    serviceGroupId?: string;
    serviceGroupName?: string;
    unitOfMeasureId?: string;
    unitOfMeasureName?: string;
    serviceTests?: ServiceTest[];
}

export interface ServiceRequestService {
    hisSereServId: number;
    serviceId: number;
    serviceCode: string;
    serviceName: string;
    price: number;
    lisServiceId?: string | null;
    unitOfMeasureId?: string | null;
    unitOfMeasureCode?: string | null;
    unitOfMeasureName?: string | null;
    rangeText?: string | null;
    rangeLow?: number | null;
    rangeHigh?: number | null;
    mapping?: string | null;
    testOrder?: number | null;
    lisService?: LisService;
    serviceTests?: ServiceTest[];
}

export interface ServiceResult {
    resultValue?: number | null;
    resultValueText?: string | null;
    resultName?: string | null;
    resultStatus?: 'NORMAL' | 'ABNORMAL' | 'CRITICAL' | string | null;
    resultDescription?: string | null;
    resultConclude?: string | null;
    resultNote?: string | null;
    resultComment?: string | null;
}

export interface StoredService {
    id: string;
    parentServiceId?: string | null;
    isChildService: number;
    hisSereServId: number;
    serviceId: number;
    serviceCode: string;
    serviceName: string;
    price: number;
    lisServiceId?: string | null;
    unitOfMeasureId?: string | null;
    unitOfMeasureCode?: string | null;
    unitOfMeasureName?: string | null;
    rangeText?: string | null;
    rangeLow?: number | null;
    rangeHigh?: number | null;
    mapping?: string | null;
    testOrder?: number | null;
    shortName?: string | null;
    description?: string | null;
    resultText?: string | null;
    resultDescription?: string | null;
    resultConclude?: string | null;
    resultNote?: string | null;
    resultComment?: string | null;
    resultValue?: number | null;
    resultValueText?: string | null;
    resultStatus?: string | null;
    resultName?: string | null;
    isNormal: number;
    resultEnteredAt?: string | null;
    resultReviewedAt?: string | null;
    resultApprovedAt?: string | null;
    resultCompletedAt?: string | null;
    sampleTypeId?: string | null;
    resultEnteredByUserId?: string | null;
    resultReviewedByUserId?: string | null;
    resultApprovedByUserId?: string | null;
    resultNotes?: string | null;
    resultMetadata?: string | null;
    qcStatus?: string | null;
    qcCheckedByUserId?: string | null;
    qcCheckedAt?: string | null;
    receptionCode?: string | null;
    sampleCollectionTime?: string | null;
    collectedByUserId?: string | null;
    testId?: string | null;
    isActive?: number | null;
    documentId?: string | number | null;
    sampleTypeName?: string | null;
    stainingMethodName?: string | null;
}

export interface StoreServiceRequestBody {
    serviceReqCode: string;
    currentRoomId: string;
    currentDepartmentId: string;
    receptionCode: string;
    sampleTypeName?: string;
    sampleCollectionTime: string;
    collectedByUserId: string;
    saveRawJson: boolean;
}

export interface StoredServiceRequestResponse {
    id: string;
    hisServiceReqCode: string;
    hisServiceReqId: number;
    serviceReqCode: string;
    serviceReqSttId: number;
    serviceReqSttCode: string;
    serviceReqTypeId: number;
    serviceReqTypeCode: string;
    instructionTime: number;
    instructionDate: number;
    icdCode: string;
    icdName: string;
    icdSubCode?: string | null;
    icdText?: string | null;
    treatmentId: number;
    treatmentCode: string;
    note?: string | null;
    requestRoomId: string;
    requestRoomCode: string;
    requestRoomName: string;
    requestRoomLisId?: string | null;
    requestDepartmentId: string;
    requestDepartmentCode: string;
    requestDepartmentName: string;
    requestDepartmentLisId?: string | null;
    executeRoomId: string;
    executeRoomCode: string;
    executeRoomName: string;
    executeRoomLisId?: string | null;
    executeDepartmentId: string;
    executeDepartmentCode: string;
    executeDepartmentName: string;
    executeDepartmentLisId?: string | null;
    currentRoomId: string;
    currentDepartmentId: string;
    patientId: string;
    patientCode: string;
    patientName: string;
    patientDob: number;
    patientCmndNumber: string;
    patientCmndDate?: number | null;
    patientCmndPlace?: string | null;
    patientMobile?: string | null;
    patientPhone?: string | null;
    patientProvinceCode: string;
    patientProvinceName: string;
    patientProvinceLisId?: string | null;
    patientCommuneCode: string;
    patientCommuneName: string;
    patientCommuneLisId?: string | null;
    patientAddress: string;
    patientGenderId: number;
    patientGenderName: string;
    patientCareerName?: string | null;
    patientLisId?: string | null;
    storedAt: string;
    storedBy: string;
    rawResponseJson?: string | null;
    services: StoredService[];
    workflowCurrentState?: {
        id: string;
        toStateId: string;
        stateCode: string;
        stateName: string;
        actionType: string;
        startedAt: string;
        actionTimestamp: string;
        completedAt?: string | null;
        isCurrent: number;
        notes?: string | null;
    };
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    stainingMethodName?: string | null;
    flag?: string | null;
}

export interface ServiceRequestDetail {
    id: number;
    serviceReqCode: string;
    serviceReqSttId?: number;
    serviceReqSttCode: string;
    serviceReqTypeId?: number;
    serviceReqTypeCode: string;
    instructionTime: number; // yyyyMMddHHmmss format
    instructionDate: number; // yyyyMMdd000000 format
    icdCode?: string | null;
    icdName?: string | null;
    icdSubCode?: string | null;
    icdText?: string | null;
    treatmentId?: number;
    treatmentCode?: string | null;
    note?: string | null;
    requestRoom?: RoomInfo;
    requestDepartment?: DepartmentInfo;
    executeRoom?: RoomInfo;
    executeDepartment?: DepartmentInfo;
    patient: PatientInfo;
    services: ServiceRequestService[];
}

export interface UserRoom {
    id: string;
    userId: string;
    username: string;
    userFullName: string;
    roomId: string;
    roomCode: string;
    roomName: string;
    roomAddress: string;
    roomDescription: string;
    departmentId: string;
    departmentName: string;
    departmentCode: string;
    roomGroupId: string;
    roomGroupName: string;
    branchId: string;
    branchName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    /** Tiền tố sinh barcode mặc định của phòng (ví dụ: T, C, F, S) */
    selectPrefix?: string;
    /** Loại form kết quả mặc định của phòng */
    resultFormType?: string;
}

export interface AssignRoomsRequest {
    roomIds: string[];
}

export interface UpdateUserRoomRequest {
    isActive?: boolean;
}

export interface GetUserRoomsFilters {
    userId?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

// API trả về data trực tiếp, không có wrapper serviceRequest
export type ServiceRequestResponse = ServiceRequestDetail;

// EMR Sign interfaces
export interface EmrSignPointSign {
    CoorXRectangle: number;
    CoorYRectangle: number;
    PageNumber: number;
    MaxPageNumber: number;
    WidthRectangle?: number;
    HeightRectangle?: number;
    TextPosition: number;
    TypeDisplay: number;
    SizeFont?: number;
    FormatRectangleText?: string;
}

export interface EmrSignSigner {
    SignerId: number;
    SerialNumber: string;
    NumOrder: number;
    //IsSigned: boolean;
}

export interface EmrSignOriginalVersion {
    Base64Data: string;
    Url?: string | null;
}

export interface EmrSignRequest {
    Description?: string;
    PointSign: EmrSignPointSign;
    DocumentName?: string;
    TreatmentCode: string;
    DocumentTypeId?: number;
    DocumentGroupId?: number;
    HisCode?: string;
    FileType?: number;
    OriginalVersion: EmrSignOriginalVersion;
    Signs: EmrSignSigner[];
}

export interface EmrSignResponse {
    Data: {
        DocumentCode: string;
        DocumentName: string;
        TreatmentCode: string;
        DocumentId: string
        DocumentTypeId: number;
        OriginalVersion: {
            Url: string | null;
            Base64Data: string;
        };
        Signs: Array<{
            Loginname?: string;
            Username?: string;
            SignerId: number;
            SerialNumber: string;
            NumOrder: number;
            IsSigned: boolean;
            SignTime?: string;
        }>;
    };
    Success: boolean;
    Param: {
        HasException: boolean;
        Messages?: string[];
    };
}

export interface EmrSignerData {
    ID: number;
    CREATE_TIME: number;
    MODIFY_TIME: number;
    CREATOR: string;
    MODIFIER: string;
    APP_CREATOR: string;
    APP_MODIFIER: string;
    IS_ACTIVE: number;
    IS_DELETE: number;
    GROUP_CODE: string;
    LOGINNAME: string;
    USERNAME: string;
    TITLE: string;
    DEPARTMENT_CODE: string;
    DEPARTMENT_NAME: string;
    NUM_ORDER: number;
    SIGN_IMAGE: string;
    PCA_SERIAL: string;
    CMND_NUMBER: string;
    EMAIL: string;
    SCA_SERIAL?: string | null;
    PHONE?: string | null;
    HSM_USER_CODE: string;
    SIGNATURE_DISPLAY_TYPE: number;
    SIGNALTURE_IMAGE_WIDTH?: number | null;
    PASSWORD?: string | null;
    SECRET_KEY?: string | null;
    EMR_SIGN_ORDER?: any[];
    EMR_SIGNER_FLOW?: any[];
    EMR_TREATMENT?: any[];
}

export interface EmrSignerParam {
    Messages: string[];
    BugCodes: string[];
    MessageCodes: string[];
    Start: number;
    Limit: number;
    Count: number;
    ModuleCode?: string | null;
    LanguageCode?: string | null;
    Now: number;
    HasException: boolean;
}

export interface EmrSignerResponse {
    Data: EmrSignerData[];
    Success: boolean;
    Param: EmrSignerParam;
}

class ApiClient {
    private readonly baseURL: string;
    private token: string | null = null;
    private refreshTokenValue: string | null = null;
    private tokenExpiresAt: number | null = null;
    private isRefreshing: boolean = false;
    private refreshSubscribers: Array<(token: string) => void> = [];

    constructor(baseURL: string = API_BASE_URL) {
        this.baseURL = baseURL;
        // Get token from auth store if available
        if (typeof globalThis.window !== "undefined") {
            this.loadTokenFromStorage();
        }
    }

    private loadTokenFromStorage() {
        try {
            // Try to get token from auth store first
            const authData = localStorage.getItem("auth-storage");
            if (authData) {
                const parsed = JSON.parse(authData);
                this.token = parsed.state?.token || null;
                this.refreshTokenValue = parsed.state?.refreshToken || null;
            }

            // Fallback to direct localStorage
            if (!this.token) {
                this.token = localStorage.getItem("auth-token");
            }
            if (!this.refreshTokenValue) {
                this.refreshTokenValue = localStorage.getItem("auth-refresh-token");
            }

            // Load token expiration time if available
            const expiresAt = localStorage.getItem("auth-token-expires-at");
            if (expiresAt) {
                this.tokenExpiresAt = Number.parseInt(expiresAt, 10);
            }
        } catch (error) {
            console.warn("Failed to parse auth storage:", error);
            // Fallback to direct localStorage
            this.token = localStorage.getItem("auth-token");
            this.refreshTokenValue = localStorage.getItem("auth-refresh-token");
            const expiresAt = localStorage.getItem("auth-token-expires-at");
            if (expiresAt) {
                this.tokenExpiresAt = Number.parseInt(expiresAt, 10);
            }
        }
    }

    setToken(token: string | null, expiresIn?: number) {
        this.token = token;

        // Set expiration time if provided
        if (expiresIn && token) {
            // expiresIn is in seconds, convert to milliseconds and add to current time
            this.tokenExpiresAt = Date.now() + (expiresIn * 1000);
            if (typeof globalThis.window !== "undefined") {
                localStorage.setItem("auth-token-expires-at", this.tokenExpiresAt.toString());
            }
        } else if (!token) {
            // Clear expiration time when token is cleared
            this.tokenExpiresAt = null;
            if (typeof globalThis.window !== "undefined") {
                localStorage.removeItem("auth-token-expires-at");
            }
        }
    }

    setRefreshToken(refreshToken: string | null) {
        this.refreshTokenValue = refreshToken;
    }

    getToken(): string | null {
        return this.token;
    }

    refreshTokenFromStorage() {
        this.loadTokenFromStorage();
    }

    /**
     * Check if token is expired or about to expire
     * Returns true if token will expire in less than 5 minutes
     */
    private isTokenExpired(): boolean {
        if (!this.tokenExpiresAt) {
            return false; // Unknown expiration, don't assume expired
        }

        // Consider token expired if it expires in less than 5 minutes (300000 ms)
        const bufferTime = 5 * 60 * 1000; // 5 minutes
        return Date.now() + bufferTime >= this.tokenExpiresAt;
    }

    /**
     * Add subscriber to be notified when token is refreshed
     */
    private subscribeTokenRefresh(callback: (token: string) => void): void {
        this.refreshSubscribers.push(callback);
    }

    /**
     * Notify all subscribers that token has been refreshed
     */
    private onTokenRefreshed(token: string): void {
        this.refreshSubscribers.forEach(callback => callback(token));
        this.refreshSubscribers = [];
    }

    /**
     * Perform token refresh
     */
    private async performTokenRefresh(): Promise<string | null> {
        if (!this.refreshTokenValue) {
            console.warn("No refresh token available");
            return null;
        }

        try {

            // Call refresh endpoint without going through request() to avoid infinite loop
            const url = `${this.baseURL}/auth/refresh`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken: this.refreshTokenValue }),
            });

            if (!response.ok) {
                console.error("Token refresh failed:", response.status);
                // If refresh token is invalid, logout user
                if (response.status === 401 || response.status === 403) {
                    this.handleLogout();
                }
                return null;
            }

            const data = await response.json();

            if (data.success && data.data) {
                const newAccessToken = data.data.accessToken;
                const newRefreshToken = data.data.refreshToken;
                const expiresIn = data.data.expiresIn;

                // Update tokens
                this.setToken(newAccessToken, expiresIn);
                this.setRefreshToken(newRefreshToken);

                // Update auth store
                if (typeof globalThis.window !== "undefined") {
                    const { useAuthStore } = await import("@/lib/stores/auth");
                    useAuthStore.getState().updateTokens(newAccessToken, newRefreshToken);
                }

                return newAccessToken;
            }

            return null;
        } catch (error) {
            console.error("Error refreshing token:", error);
            return null;
        }
    }

    /**
     * Handle logout when refresh token fails
     */
    private async handleLogout(): Promise<void> {

        this.token = null;
        this.refreshTokenValue = null;
        this.tokenExpiresAt = null;

        if (typeof globalThis.window !== "undefined") {
            const { useAuthStore } = await import("@/lib/stores/auth");
            useAuthStore.getState().logout();

            // Redirect to login page
            globalThis.window.location.href = "/auth/login";
        }
    }

    /**
     * Ensure token is valid before making request
     */
    private async ensureValidToken(): Promise<boolean> {
        // If token is expired or about to expire, refresh it
        if (this.isTokenExpired() && this.refreshTokenValue) {
            if (this.isRefreshing) {
                // Wait for ongoing refresh to complete
                return new Promise((resolve) => {
                    this.subscribeTokenRefresh((token) => {
                        resolve(!!token);
                    });
                });
            }

            this.isRefreshing = true;
            const newToken = await this.performTokenRefresh();
            this.isRefreshing = false;

            if (newToken) {
                this.onTokenRefreshed(newToken);
                return true;
            }
            return false;
        }

        return true;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
        isRetry: boolean = false
    ): Promise<ApiResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...(options.headers as Record<string, string>),
        };

        // Refresh token from storage before making request
        this.refreshTokenFromStorage();

        // Ensure token is valid before making request (unless it's the refresh endpoint)
        if (!endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
            const isValid = await this.ensureValidToken();
            if (!isValid && this.token) {
                // Token refresh failed, return unauthorized error
                return {
                    success: false,
                    error: "Session expired. Please login again.",
                    status: 401,
                };
            }
        }

        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        try {

            const response = await fetch(url, {
                ...options,
                headers,
            });

            let data: unknown;
            const contentType = response.headers.get("content-type");

            if (contentType?.includes("application/json")) {
                data = await response.json();
            } else {
                data = {message: await response.text()};
            }

            // Handle 401 Unauthorized - token expired
            if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {

                // Try to refresh token
                if (this.refreshTokenValue) {
                    const newToken = await this.performTokenRefresh();

                    if (newToken) {
                        // Retry the original request with new token
                        return this.request<T>(endpoint, options, true);
                    }
                }

                // If refresh failed, logout user
                await this.handleLogout();
                return {
                    success: false,
                    error: "Session expired. Please login again.",
                    status: 401,
                    data: data as T,
                };
            }

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;

                // Handle complex error structure from backend
                if (
                    data &&
                    typeof data === "object" &&
                    "error" in data &&
                    data.error &&
                    typeof data.error === "object" &&
                    "message" in data.error
                ) {
                    errorMessage = String(data.error.message);
                } else if (data && typeof data === "object" && "message" in data) {
                    errorMessage = String(data.message);
                } else if (data && typeof data === "object" && "error" in data) {
                    errorMessage = String(data.error);
                }

                console.error("API Error:", errorMessage);
                console.error("API Error Data:", data);
                return {
                    success: false,
                    error: errorMessage,
                    status: response.status,
                    data: data as T,
                };
            }

            return {
                success: true,
                data:
                    data && typeof data === "object" && "data" in data
                        ? (data.data as T)
                        : (data as T),
                message:
                    data && typeof data === "object" && "message" in data
                        ? String(data.message)
                        : undefined,
            };
        } catch (error) {
            console.error("API request failed:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Network error",
            };
        }
    }

    // Authentication methods
    async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        const response = await this.request<LoginResponse>("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });

        if (response.success && response.data?.accessToken) {
            this.setToken(response.data.accessToken, response.data.expiresIn);
            this.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
        const response = await this.request<RegisterResponse>("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData),
        });

        // Nếu đăng ký thành công, có thể lưu token (tùy chọn)
        if (response.success && response.data?.accessToken) {
            // Không tự động set token khi register, để user tự login sau
            // this.setToken(response.data.accessToken, expiresIn);
            // this.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async registerWithProfile(userData: RegisterWithProfileRequest): Promise<ApiResponse<RegisterResponse>> {
        const response = await this.request<RegisterResponse>("/auth/register-with-profile", {
            method: "POST",
            body: JSON.stringify(userData),
        });

        // Nếu đăng ký thành công, có thể lưu token (tùy chọn)
        if (response.success && response.data?.accessToken) {
            // Không tự động set token khi register, để user tự login sau
            // this.setToken(response.data.accessToken, expiresIn);
            // this.setRefreshToken(response.data.refreshToken);
        }

        return response;
    }

    async logout(): Promise<ApiResponse> {
        try {
            await this.request("/auth/logout", {
                method: "POST",
            });
            return { success: true, status_code: 200 } as ApiResponse;
        } catch (error) {
            console.warn('Logout API error:', error);
            return { success: false, status_code: 500 } as ApiResponse;
        } finally {
            // Clear all tokens and state
            this.setToken(null);
            this.setRefreshToken(null);
            this.tokenExpiresAt = null;
            this.isRefreshing = false;
            this.refreshSubscribers = [];

            // Clear localStorage
            if (typeof globalThis.window !== 'undefined') {
                localStorage.removeItem('auth-token');
                localStorage.removeItem('auth-refresh-token');
                localStorage.removeItem('auth-token-expires-at');
            }
        }
    }

    async refreshToken(
        refreshToken: string
    ): Promise<ApiResponse<LoginResponse>> {
        return this.request<LoginResponse>("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({refreshToken}),
        });
    }

    async getProfile(): Promise<ApiResponse<LoginResponse["user"]>> {
        return this.request<LoginResponse["user"]>("/auth/profile");
    }

    async changePassword(passwordData: ChangePasswordRequest): Promise<ApiResponse> {
        return this.request("/auth/change-password", {
            method: "POST",
            body: JSON.stringify(passwordData),
        });
    }

    async createProfile(profileData: {
        provinceId?: string;
        wardId?: string;
        address?: string;
        departmentId?: string;
        position?: string;
        employeeCode?: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        gender?: 'MALE' | 'FEMALE' | 'OTHER';
        avatar?: string;
        mappedUsername?: string;
        mappedPassword?: string;
    }): Promise<ApiResponse<{
        id: string;
        userId: string;
        provinceId?: string;
        provinceName?: string;
        wardId?: string;
        wardName?: string;
        address?: string;
        fullAddress?: string;
        departmentId?: string;
        departmentName?: string;
        position?: string;
        employeeCode?: string;
        workInfo?: string;
        phoneNumber?: string;
        dateOfBirth?: Date;
        age?: number;
        gender?: string;
        avatar?: string;
        mappedUsername?: string;
        hasMappedPassword?: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy?: string;
        updatedBy?: string;
        version: number;
    }>> {
        return this.request("/profiles", {
            method: "POST",
            body: JSON.stringify(profileData),
        });
    }

    async getProfileByUserId(userId: string): Promise<ApiResponse<{
        id: string;
        userId: string;
        provinceId?: string;
        provinceName?: string;
        wardId?: string;
        wardName?: string;
        address?: string;
        fullAddress?: string;
        departmentId?: string;
        departmentName?: string;
        position?: string;
        employeeCode?: string;
        workInfo?: string;
        phoneNumber?: string;
        dateOfBirth?: Date;
        age?: number;
        gender?: string;
        avatar?: string;
        mappedUsername?: string;
        hasMappedPassword?: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy?: string;
        updatedBy?: string;
        version: number;
    }>> {
        return this.request(`/profiles/user/${userId}`);
    }

    async updateProfile(userId: string, profileData: {
        provinceId?: string;
        wardId?: string;
        address?: string;
        departmentId?: string;
        position?: string;
        employeeCode?: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        avatar?: string;
        mappedUsername?: string;
        mappedPassword?: string;
    }): Promise<ApiResponse<{
        id: string;
        userId: string;
        provinceId?: string;
        provinceName?: string;
        wardId?: string;
        wardName?: string;
        address?: string;
        fullAddress?: string;
        departmentId?: string;
        departmentName?: string;
        position?: string;
        employeeCode?: string;
        workInfo?: string;
        phoneNumber?: string;
        dateOfBirth?: Date;
        age?: number;
        gender?: string;
        avatar?: string;
        mappedUsername?: string;
        hasMappedPassword?: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy?: string;
        updatedBy?: string;
        version: number;
    }>> {
        return this.request(`/profiles/user/${userId}`, {
            method: "PATCH",
            body: JSON.stringify(profileData),
        });
    }

    // Category management methods
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return this.request<Category[]>("/categories");
    }

    async getCategory(id: string): Promise<ApiResponse<Category>> {
        return this.request<Category>(`/categories/${id}`);
    }

    async createCategory(
        category: CategoryRequest
    ): Promise<ApiResponse<Category>> {
        return this.request<Category>("/categories", {
            method: "POST",
            body: JSON.stringify(category),
        });
    }

    async updateCategory(
        id: string,
        category: Partial<CategoryRequest>
    ): Promise<ApiResponse<Category>> {
        return this.request<Category>(`/categories/${id}`, {
            method: "PUT",
            body: JSON.stringify(category),
        });
    }

    async deleteCategory(id: string): Promise<ApiResponse> {
        return this.request(`/categories/${id}`, {
            method: "DELETE",
        });
    }

    // Branch management methods
    async getBranches(filters?: BranchFilters): Promise<
        ApiResponse<{
            items: Branch[];
            pagination: {
                limit: number;
                offset: number;
                total: number;
                has_next: boolean;
                has_prev: boolean;
            };
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: Branch[];
            pagination: {
                limit: number;
                offset: number;
                total: number;
                has_next: boolean;
                has_prev: boolean;
            };
        }>(`/branches${queryString ? `?${queryString}` : ""}`);
    }

    async getBranch(id: string): Promise<ApiResponse<Branch>> {
        return this.request<Branch>(`/branches/${id}`);
    }

    async createBranch(branch: BranchRequest): Promise<ApiResponse<Branch>> {
        return this.request<Branch>("/branches", {
            method: "POST",
            body: JSON.stringify(branch),
        });
    }

    async updateBranch(
        id: string,
        branch: Partial<BranchRequest>
    ): Promise<ApiResponse<Branch>> {
        return this.request<Branch>(`/branches/${id}`, {
            method: "PUT",
            body: JSON.stringify(branch),
        });
    }

    async deleteBranch(id: string): Promise<ApiResponse> {
        return this.request(`/branches/${id}`, {
            method: "DELETE",
        });
    }

    async getBranchesByProvince(
        provinceId: string,
        limit = 10,
        offset = 0
    ): Promise<
        ApiResponse<{
            items: Branch[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        return this.request<{
            items: Branch[];
            total: number;
            limit: number;
            offset: number;
        }>(`/provinces/${provinceId}/branches?limit=${limit}&offset=${offset}`);
    }

    // Province management methods
    async getProvinces(filters?: ProvinceFilters): Promise<
        ApiResponse<{
            provinces: Province[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            provinces: Province[];
            total: number;
            limit: number;
            offset: number;
        }>(`/provinces${queryString ? `?${queryString}` : ""}`);
    }

    async getProvince(id: string): Promise<ApiResponse<Province>> {
        return this.request<Province>(`/provinces/${id}`);
    }

    async createProvince(
        province: ProvinceRequest
    ): Promise<ApiResponse<Province>> {
        return this.request<Province>("/provinces", {
            method: "POST",
            body: JSON.stringify(province),
        });
    }

    async updateProvince(
        id: string,
        province: Partial<ProvinceRequest>
    ): Promise<ApiResponse<Province>> {
        return this.request<Province>(`/provinces/${id}`, {
            method: "PUT",
            body: JSON.stringify(province),
        });
    }

    async deleteProvince(id: string): Promise<ApiResponse> {
        return this.request(`/provinces/${id}`, {
            method: "DELETE",
        });
    }

    // Ward management methods
    async getWards(filters?: WardFilters): Promise<
        ApiResponse<{
            wards: Ward[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasNext: boolean;
                hasPrev: boolean;
                totalPages: number;
                currentPage: number;
            };
            statistics: {
                total: number;
                active: number;
                inactive: number;
            };
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            wards: Ward[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasNext: boolean;
                hasPrev: boolean;
                totalPages: number;
                currentPage: number;
            };
            statistics: {
                total: number;
                active: number;
                inactive: number;
            };
        }>(`/wards${queryString ? `?${queryString}` : ""}`);
    }

    async getWard(id: string): Promise<ApiResponse<Ward>> {
        return this.request<Ward>(`/wards/${id}`);
    }

    async getWardsByProvince(
        provinceId: string,
        limit = 10,
        offset = 0
    ): Promise<
        ApiResponse<{
            items: Ward[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        return this.request<{
            items: Ward[];
            total: number;
            limit: number;
            offset: number;
        }>(`/wards/province/${provinceId}?limit=${limit}&offset=${offset}`);
    }

    async createWard(ward: WardRequest): Promise<ApiResponse<Ward>> {
        return this.request<Ward>("/wards", {
            method: "POST",
            body: JSON.stringify(ward),
        });
    }

    async updateWard(
        id: string,
        ward: Partial<WardRequest>
    ): Promise<ApiResponse<Ward>> {
        return this.request<Ward>(`/wards/${id}`, {
            method: "PUT",
            body: JSON.stringify(ward),
        });
    }

    async deleteWard(id: string): Promise<ApiResponse> {
        return this.request(`/wards/${id}`, {
            method: "DELETE",
        });
    }

    // HIS Integration methods
    async hisLogin(): Promise<ApiResponse<HisTokenResponse>> {
        return this.request<HisTokenResponse>("/his-integration/login", {
            method: "POST",
        });
    }

    async hisLoginWithCredentials(credentials: {
        username: string;
        password: string;
    }): Promise<ApiResponse<HisDirectLoginResponse>> {
        return this.request<HisDirectLoginResponse>("/his-direct-login/login", {
            method: "POST",
            body: JSON.stringify(credentials),
        });
    }

    async validateHisToken(
        token: string
    ): Promise<ApiResponse<HisTokenValidationResponse>> {
        return this.request<HisTokenValidationResponse>(
            "/his-direct-login/validate-token",
            {
                method: "POST",
                body: JSON.stringify({token}),
            }
        );
    }

    async hisRenewToken(
        renewCode: string
    ): Promise<ApiResponse<HisTokenResponse>> {
        return this.request<HisTokenResponse>("/his-integration/renew-token", {
            method: "POST",
            body: JSON.stringify({renewCode}),
        });
    }

    async getHisToken(username?: string): Promise<ApiResponse<HisTokenResponse>> {
        const endpoint = username
            ? `/his-integration/token?username=${username}`
            : "/his-integration/token";
        return this.request<HisTokenResponse>(endpoint);
    }

    async refreshHisToken(
        username?: string
    ): Promise<ApiResponse<HisTokenResponse>> {
        const endpoint = username
            ? `/his-integration/refresh-token?username=${username}`
            : "/his-integration/refresh-token";
        return this.request<HisTokenResponse>(endpoint, {
            method: "POST",
        });
    }

    async callHisApi(request: HisApiCallRequest): Promise<ApiResponse> {
        return this.request("/his-integration/call-api", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    async getHisUserInfo(username: string): Promise<ApiResponse<HisUserInfo>> {
        return this.request<HisUserInfo>(`/his-integration/user-info/${username}`);
    }

    async hisLogout(username: string): Promise<ApiResponse> {
        return this.request(`/his-integration/logout/${username}`, {
            method: "POST",
        });
    }

    async getHisTokenStatus(
        username?: string
    ): Promise<ApiResponse<HisTokenStatus>> {
        const endpoint = username
            ? `/his-integration/token-status?username=${username}`
            : "/his-integration/token-status";
        return this.request<HisTokenStatus>(endpoint);
    }

    async cleanupExpiredHisTokens(): Promise<ApiResponse> {
        return this.request("/his-integration/cleanup-expired-tokens", {
            method: "POST",
        });
    }

    // EMR Sign methods
    async createAndSignHsm(
        signRequest: EmrSignRequest,
        tokenCode: string,
        applicationCode: string = 'EMR'
    ): Promise<ApiResponse<EmrSignResponse>> {
        if (!tokenCode) {
            throw new Error('TokenCode header is required');
        }

        return this.request<EmrSignResponse>("/emr/create-and-sign-hsm", {
            method: "POST",
            body: JSON.stringify(signRequest),
            headers: {
                'TokenCode': tokenCode,
                'ApplicationCode': applicationCode,
            },
        });
    }

    async deleteEmrDocument(
        documentId: number,
        tokenCode: string,
        applicationCode: string = 'EMR'
    ): Promise<ApiResponse> {
        if (!tokenCode) {
            throw new Error('TokenCode header is required');
        }

        // Đảm bảo documentId là number
        const numericDocumentId = typeof documentId === 'string' ? Number.parseInt(documentId, 10) : documentId;
        
        if (isNaN(numericDocumentId)) {
            throw new Error('documentId must be a valid number');
        }

        return this.request("/emr/delete-document", {
            method: "POST",
            body: JSON.stringify({ documentId: numericDocumentId }),
            headers: {
                'TokenCode': tokenCode,
                'ApplicationCode': applicationCode,
            },
        });
    }

    async getEmrSigner(
        tokenCode: string,
        applicationCode: string = 'EMR',
        params?: {
            Start?: number;
            Limit?: number;
            loginname?: string;
        }
    ): Promise<ApiResponse<EmrSignerResponse>> {
        if (!tokenCode) {
            throw new Error('TokenCode header is required');
        }

        const queryParams = new URLSearchParams();
        if (params?.Start !== undefined) {
            queryParams.append('Start', params.Start.toString());
        }
        if (params?.Limit !== undefined) {
            queryParams.append('Limit', params.Limit.toString());
        }
        if (params?.loginname) {
            queryParams.append('loginname', params.loginname);
        }

        const queryString = queryParams.toString();
        return this.request<EmrSignerResponse>(
            `/emr/signer${queryString ? `?${queryString}` : ''}`,
            {
                method: "GET",
                headers: {
                    'TokenCode': tokenCode,
                    'ApplicationCode': applicationCode,
                },
            }
        );
    }

    // HIS-PACS methods
    /**
     * Start for HIS-PACS
     * POST /his-pacs/start
     */
    async startHisPacs(
        tdlServiceReqCode: string,
        tokenCode: string
    ): Promise<ApiResponse<unknown>> {
        if (!tokenCode) {
            throw new Error('TokenCode header is required');
        }

        const queryParams = new URLSearchParams();
        queryParams.append('tdlServiceReqCode', tdlServiceReqCode);

        const queryString = queryParams.toString();
        return this.request<unknown>(
            `/his-pacs/start?${queryString}`,
            {
                method: 'POST',
                headers: {
                    'TokenCode': tokenCode,
                },
            }
        );
    }

    /**
     * Unstart for HIS-PACS
     * POST /his-pacs/unstart
     */
    async unstartHisPacs(
        tdlServiceReqCode: string,
        tokenCode: string
    ): Promise<ApiResponse<unknown>> {
        if (!tokenCode) {
            throw new Error('TokenCode header is required');
        }

        const queryParams = new URLSearchParams();
        queryParams.append('tdlServiceReqCode', tdlServiceReqCode);

        const queryString = queryParams.toString();
        return this.request<unknown>(
            `/his-pacs/unstart?${queryString}`,
            {
                method: 'POST',
                headers: {
                    'TokenCode': tokenCode,
                },
            }
        );
    }

    /**
     * Update result for HIS-PACS
     * POST /his-pacs/update-result
     */
    async updateHisPacsResult(
        params: {
            tdlServiceReqCode: string;
            tdlServiceCode: string;
        },
        requestBody: HisPacsUpdateResultRequest,
        tokenCode: string
    ): Promise<ApiResponse<unknown>> {
        if (!tokenCode) {
            throw new Error('TokenCode header is required');
        }

        const queryParams = new URLSearchParams();
        queryParams.append('tdlServiceReqCode', params.tdlServiceReqCode);
        queryParams.append('tdlServiceCode', params.tdlServiceCode);

        const queryString = queryParams.toString();
        return this.request<unknown>(
            `/his-pacs/update-result?${queryString}`,
            {
                method: 'POST',
                body: JSON.stringify(requestBody),
                headers: {
                    'TokenCode': tokenCode,
                },
            }
        );
    }

    // User management methods
    async getUsers(filters?: UserFilters): Promise<
        ApiResponse<{
            users: User[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            users: User[];
            total: number;
            limit: number;
            offset: number;
        }>(`/users${queryString ? `?${queryString}` : ""}`);
    }

    async getUser(id: string): Promise<ApiResponse<User>> {
        return this.request<User>(`/users/${id}`);
    }

    async getUserByEmail(email: string): Promise<ApiResponse<User>> {
        return this.request<User>(`/users/email/${encodeURIComponent(email)}`);
    }

    async createUser(user: UserRequest): Promise<ApiResponse<User>> {
        return this.request<User>("/users", {
            method: "POST",
            body: JSON.stringify(user),
        });
    }

    async updateUser(
        id: string,
        user: Partial<UserRequest>
    ): Promise<ApiResponse<User>> {
        return this.request<User>(`/users/${id}`, {
            method: "PUT",
            body: JSON.stringify(user),
        });
    }

    async deleteUser(id: string): Promise<ApiResponse> {
        return this.request(`/users/${id}`, {
            method: "DELETE",
        });
    }

    // Department Type management methods
    async getDepartmentTypes(filters?: DepartmentTypeFilters): Promise<
        ApiResponse<{
            items: DepartmentType[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: DepartmentType[];
            total: number;
            limit: number;
            offset: number;
        }>(`/department-types${queryString ? `?${queryString}` : ""}`);
    }

    async getDepartmentType(id: string): Promise<ApiResponse<DepartmentType>> {
        return this.request<DepartmentType>(`/department-types/${id}`);
    }

    async createDepartmentType(
        departmentType: DepartmentTypeRequest
    ): Promise<ApiResponse<DepartmentType>> {
        return this.request<DepartmentType>("/department-types", {
            method: "POST",
            body: JSON.stringify(departmentType),
        });
    }

    async updateDepartmentType(
        id: string,
        departmentType: Partial<DepartmentTypeRequest>
    ): Promise<ApiResponse<DepartmentType>> {
        return this.request<DepartmentType>(`/department-types/${id}`, {
            method: "PUT",
            body: JSON.stringify(departmentType),
        });
    }

    async deleteDepartmentType(id: string): Promise<ApiResponse> {
        return this.request(`/department-types/${id}`, {
            method: "DELETE",
        });
    }

    // Department management methods
    async getDepartments(filters?: DepartmentFilters): Promise<
        ApiResponse<{
            departments: Department[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            departments: Department[];
            total: number;
            limit: number;
            offset: number;
        }>(`/departments${queryString ? `?${queryString}` : ""}`);
    }

    async getDepartment(id: string): Promise<ApiResponse<Department>> {
        return this.request<Department>(`/departments/${id}`);
    }

    async createDepartment(
        department: DepartmentRequest
    ): Promise<ApiResponse<Department>> {
        return this.request<Department>("/departments", {
            method: "POST",
            body: JSON.stringify(department),
        });
    }

    async updateDepartment(
        id: string,
        department: Partial<DepartmentRequest>
    ): Promise<ApiResponse<Department>> {
        return this.request<Department>(`/departments/${id}`, {
            method: "PUT",
            body: JSON.stringify(department),
        });
    }

    async deleteDepartment(id: string): Promise<ApiResponse> {
        return this.request(`/departments/${id}`, {
            method: "DELETE",
        });
    }

    async getDepartmentsByBranch(
        branchId: string,
        limit = 10,
        offset = 0
    ): Promise<
        ApiResponse<{
            items: Department[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        return this.request<{
            items: Department[];
            total: number;
            limit: number;
            offset: number;
        }>(`/branches/${branchId}/departments?limit=${limit}&offset=${offset}`);
    }

    // Service Group management methods
    async getServiceGroups(filters?: ServiceGroupFilters): Promise<
        ApiResponse<{
            items: ServiceGroup[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: ServiceGroup[];
            total: number;
            limit: number;
            offset: number;
        }>(`/service-groups${queryString ? `?${queryString}` : ""}`);
    }

    async getServiceGroup(id: string): Promise<ApiResponse<ServiceGroup>> {
        return this.request<ServiceGroup>(`/service-groups/${id}`);
    }

    async createServiceGroup(
        serviceGroup: ServiceGroupRequest
    ): Promise<ApiResponse<ServiceGroup>> {
        return this.request<ServiceGroup>("/service-groups", {
            method: "POST",
            body: JSON.stringify(serviceGroup),
        });
    }

    async updateServiceGroup(
        id: string,
        serviceGroup: Partial<ServiceGroupRequest>
    ): Promise<ApiResponse<ServiceGroup>> {
        return this.request<ServiceGroup>(`/service-groups/${id}`, {
            method: "PUT",
            body: JSON.stringify(serviceGroup),
        });
    }

    async deleteServiceGroup(id: string): Promise<ApiResponse> {
        return this.request(`/service-groups/${id}`, {
            method: "DELETE",
        });
    }

    // Unit of Measure management methods
    async getUnitOfMeasures(filters?: UnitOfMeasureFilters): Promise<
        ApiResponse<{
            items: UnitOfMeasure[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: UnitOfMeasure[];
            total: number;
            limit: number;
            offset: number;
        }>(`/unit-of-measures${queryString ? `?${queryString}` : ""}`);
    }

    async getUnitOfMeasure(id: string): Promise<ApiResponse<UnitOfMeasure>> {
        return this.request<UnitOfMeasure>(`/unit-of-measures/${id}`);
    }

    async createUnitOfMeasure(
        unitOfMeasure: UnitOfMeasureRequest
    ): Promise<ApiResponse<UnitOfMeasure>> {
        return this.request<UnitOfMeasure>("/unit-of-measures", {
            method: "POST",
            body: JSON.stringify(unitOfMeasure),
        });
    }

    async updateUnitOfMeasure(
        id: string,
        unitOfMeasure: Partial<UnitOfMeasureRequest>
    ): Promise<ApiResponse<UnitOfMeasure>> {
        return this.request<UnitOfMeasure>(`/unit-of-measures/${id}`, {
            method: "PUT",
            body: JSON.stringify(unitOfMeasure),
        });
    }

    async deleteUnitOfMeasure(id: string): Promise<ApiResponse> {
        return this.request(`/unit-of-measures/${id}`, {
            method: "DELETE",
        });
    }

    // Service management methods
    async getServices(filters?: ServiceFilters): Promise<
        ApiResponse<{
            items: Service[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: Service[];
            total: number;
            limit: number;
            offset: number;
        }>(`/services${queryString ? `?${queryString}` : ""}`);
    }

    async getService(id: string): Promise<ApiResponse<Service>> {
        return this.request<Service>(`/services/${id}`);
    }

    async createService(service: ServiceRequest): Promise<ApiResponse<Service>> {
        return this.request<Service>("/services", {
            method: "POST",
            body: JSON.stringify(service),
        });
    }

    async updateService(
        id: string,
        service: Partial<ServiceRequest>
    ): Promise<ApiResponse<Service>> {
        return this.request<Service>(`/services/${id}`, {
            method: "PUT",
            body: JSON.stringify(service),
        });
    }

    async deleteService(id: string): Promise<ApiResponse> {
        return this.request(`/services/${id}`, {
            method: "DELETE",
        });
    }

    async getServicesByGroup(
        serviceGroupId: string,
        limit = 10,
        offset = 0
    ): Promise<
        ApiResponse<{
            items: Service[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        return this.request<{
            items: Service[];
            total: number;
            limit: number;
            offset: number;
        }>(
            `/service-groups/${serviceGroupId}/services?limit=${limit}&offset=${offset}`
        );
    }

    // Room management methods
    async getRooms(filters?: {
        limit?: number;
        offset?: number;
        isActive?: boolean;
        departmentId?: string;
        roomGroupId?: string;
    }): Promise<
        ApiResponse<{
            rooms: Room[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            rooms: Room[];
            total: number;
            limit: number;
            offset: number;
        }>(`/rooms${queryString ? `?${queryString}` : ""}`);
    }

    async getRoom(id: string): Promise<ApiResponse<Room>> {
        return this.request<Room>(`/rooms/${id}`);
    }

    async createRoom(room: RoomRequest): Promise<ApiResponse<Room>> {
        return this.request<Room>("/rooms", {
            method: "POST",
            body: JSON.stringify(room),
        });
    }

    async updateRoom(
        id: string,
        room: Partial<RoomRequest>
    ): Promise<ApiResponse<Room>> {
        return this.request<Room>(`/rooms/${id}`, {
            method: "PUT",
            body: JSON.stringify(room),
        });
    }

    async deleteRoom(id: string): Promise<ApiResponse> {
        return this.request(`/rooms/${id}`, {
            method: "DELETE",
        });
    }

    // Room Group management methods
    async getRoomGroups(filters?: RoomGroupFilters): Promise<
        ApiResponse<{
            items: RoomGroup[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: RoomGroup[];
            total: number;
            limit: number;
            offset: number;
        }>(`/room-groups${queryString ? `?${queryString}` : ""}`);
    }

    async getRoomsByDepartment(
        departmentId: string,
        filters?: {
            limit?: number;
            offset?: number;
            isActive?: boolean;
        }
    ): Promise<
        ApiResponse<{
            rooms: Room[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        }>
    > {
        const params = new URLSearchParams();
        if (filters?.limit !== undefined) {
            params.append('limit', filters.limit.toString());
        }
        if (filters?.offset !== undefined) {
            params.append('offset', filters.offset.toString());
        }
        if (filters?.isActive !== undefined) {
            params.append('isActive', filters.isActive.toString());
        }
        const queryString = params.toString();
        return this.request<{
            rooms: Room[];
            pagination: {
                total: number;
                limit: number;
                offset: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        }>(`/rooms/by-department/${departmentId}${queryString ? `?${queryString}` : ""}`);
    }

    // Sample Type management methods
    async getSampleTypes(filters?: SampleTypeFilters): Promise<
        ApiResponse<{
            sampleTypes: SampleType[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();

        // Set defaults
        params.append("limit", "1000");
        params.append("offset", "0");
        params.append("sortBy", "sortOrder");
        params.append("sortOrder", "ASC");

        // Apply filters (excluding isActive as backend doesn't support it)
        if (filters) {
            if (filters.search) {
                params.set("search", filters.search);
            }
            if (filters.limit !== undefined) {
                params.set("limit", filters.limit.toString());
            }
            if (filters.offset !== undefined) {
                params.set("offset", filters.offset.toString());
            }
        }

        const queryString = params.toString();
        return this.request<{
            sampleTypes: SampleType[];
            total: number;
            limit: number;
            offset: number;
        }>(`/sample-types?${queryString}`);
    }

    async getSampleType(id: string): Promise<ApiResponse<SampleType>> {
        return this.request<SampleType>(`/sample-types/${id}`);
    }

    async createSampleType(
        sampleType: SampleTypeRequest
    ): Promise<ApiResponse<SampleType>> {
        return this.request<SampleType>("/sample-types", {
            method: "POST",
            body: JSON.stringify(sampleType),
        });
    }

    async updateSampleType(
        id: string,
        sampleType: Partial<SampleTypeRequest>
    ): Promise<ApiResponse<SampleType>> {
        return this.request<SampleType>(`/sample-types/${id}`, {
            method: "PUT",
            body: JSON.stringify(sampleType),
        });
    }

    async deleteSampleType(id: string): Promise<ApiResponse> {
        return this.request(`/sample-types/${id}`, {
            method: "DELETE",
        });
    }

    async getSampleTypeByTypeName(typeName: string): Promise<ApiResponse<SampleType[]>> {
        return this.request<SampleType[]>(`/sample-types/by-type-name/${encodeURIComponent(typeName)}`);
    }

    // Staining Method management methods
    async getStainingMethods(filters?: StainingMethodFilters): Promise<
        ApiResponse<{
            stainingMethods: StainingMethod[];
            total: number;
            limit: number;
            offset: number;
        }>
    > {
        const params = new URLSearchParams();
        
        // Set defaults
        params.append("limit", "100");
        params.append("offset", "0");
        
        // Apply filters
        if (filters) {
            if (filters.limit !== undefined) {
                params.set("limit", filters.limit.toString());
            }
            if (filters.offset !== undefined) {
                params.set("offset", filters.offset.toString());
            }
            if (filters.search) {
                params.set("search", filters.search);
            }
        }
        
        const queryString = params.toString();
        return this.request<{
            stainingMethods: StainingMethod[];
            total: number;
            limit: number;
            offset: number;
        }>(`/staining-methods?${queryString}`);
    }

    async getStainingMethod(id: string): Promise<ApiResponse<StainingMethod>> {
        return this.request<StainingMethod>(`/staining-methods/${id}`);
    }

    async createStainingMethod(
        data: StainingMethodRequest
    ): Promise<ApiResponse<StainingMethod>> {
        return this.request<StainingMethod>('/staining-methods', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateStainingMethod(
        id: string,
        data: Partial<StainingMethodRequest>
    ): Promise<ApiResponse<StainingMethod>> {
        return this.request<StainingMethod>(`/staining-methods/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteStainingMethod(id: string): Promise<ApiResponse> {
        return this.request(`/staining-methods/${id}`, {
            method: 'DELETE',
        });
    }

    // ========== RESULT TEMPLATE ENDPOINTS ==========

    async getResultTemplates(
        filters?: ResultTemplateFilters
    ): Promise<ApiResponse<{
        data: ResultTemplate[];
        total: number;
        limit: number;
        offset: number;
    }>> {
        const params = new URLSearchParams();
        params.append("limit", filters?.limit?.toString() || "10");
        params.append("offset", filters?.offset?.toString() || "0");
        params.append("sortBy", filters?.sortBy || "createdAt");
        params.append("sortOrder", filters?.sortOrder || "DESC");

        const queryString = params.toString();
        return this.request<{
            data: ResultTemplate[];
            total: number;
            limit: number;
            offset: number;
        }>(`/result-templates?${queryString}`);
    }

    async getResultTemplate(id: string): Promise<ApiResponse<ResultTemplate>> {
        return this.request<ResultTemplate>(`/result-templates/${id}`);
    }

    async createResultTemplate(
        template: ResultTemplateRequest
    ): Promise<ApiResponse<ResultTemplate>> {
        return this.request<ResultTemplate>("/result-templates", {
            method: "POST",
            body: JSON.stringify(template),
        });
    }

    async updateResultTemplate(
        id: string,
        template: Partial<ResultTemplateRequest>
    ): Promise<ApiResponse<ResultTemplate>> {
        return this.request<ResultTemplate>(`/result-templates/${id}`, {
            method: "PATCH",
            body: JSON.stringify(template),
        });
    }

    async deleteResultTemplate(id: string): Promise<ApiResponse> {
        return this.request(`/result-templates/${id}`, {
            method: "DELETE",
        });
    }

    async searchResultTemplates(
        filters?: ResultTemplateFilters
    ): Promise<ApiResponse<{
        data: ResultTemplate[];
        total: number;
        limit: number;
        offset: number;
    }>> {
        const params = new URLSearchParams();
        if (filters?.keyword) {
            params.append("keyword", filters.keyword);
        }
        params.append("limit", filters?.limit?.toString() || "10");
        params.append("offset", filters?.offset?.toString() || "0");
        params.append("sortBy", filters?.sortBy || "createdAt");
        params.append("sortOrder", filters?.sortOrder || "DESC");

        const queryString = params.toString();
        return this.request<{
            data: ResultTemplate[];
            total: number;
            limit: number;
            offset: number;
        }>(`/result-templates/search/keyword?${queryString}`);
    }

    async getServiceRequestByCode(
        serviceReqCode: string
    ): Promise<ApiResponse<ServiceRequestResponse>> {
        return this.request<ServiceRequestResponse>(
            `/service-requests/code/${serviceReqCode}`
        );
    }

    async searchServiceRequests(query: string): Promise<ApiResponse<any>> {
        const params = new URLSearchParams();
        if (query) {
            params.append("search", query);
        }
        return this.request<any>(`/service-requests?${params.toString()}`);
    }

    async createSampleReception(
        request: SampleReceptionRequest
    ): Promise<ApiResponse<SampleReceptionResponse>> {
        return this.request<SampleReceptionResponse>("/sample-receptions", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    async createSampleReceptionByPrefix(
        request: CreateSampleReceptionByPrefixRequest
    ): Promise<ApiResponse<SampleReceptionResponse>> {
        return this.request<SampleReceptionResponse>("/sample-receptions/by-prefix", {
            method: "POST",
            body: JSON.stringify(request),
        });
    }

    async querySampleTypeByReceptionCode(
        receptionCode: string
    ): Promise<ApiResponse<{ sampleTypeId: string }>> {
        return this.request<{ sampleTypeId: string }>("/sample-receptions/query-sample-type", {
            method: "POST",
            body: JSON.stringify({ receptionCode }),
        });
    }

    async generateSampleReceptionCode(
        sampleTypeCode: string,
        date: string
    ): Promise<ApiResponse<SampleReceptionResponse>> {
        const params = new URLSearchParams();
        params.append("sampleTypeCode", sampleTypeCode);
        params.append("date", date);
        return this.request<SampleReceptionResponse>(
            `/sample-receptions/generate-code?${params.toString()}`
        );
    }

    async getMyRooms(): Promise<ApiResponse<UserRoom[]>> {
        // BE trả về { success, status_code, data: UserRoom[] }
        return this.request<UserRoom[]>("/user-rooms/my-rooms");
    }

    async storeServiceRequest(
        body: StoreServiceRequestBody
    ): Promise<ApiResponse<unknown>> {
        return this.request<unknown>("/service-requests/store", {
            method: "POST",
            body: JSON.stringify(body),
        });
    }

    async getStoredServiceRequest(
        id: string
    ): Promise<ApiResponse<StoredServiceRequestResponse>> {
        return this.request<StoredServiceRequestResponse>(
            `/service-requests/stored/${id}`
        );
    }

    async getStoredServiceById(
        serviceId: string
    ): Promise<ApiResponse<StoredService>> {
        return this.request<StoredService>(
            `/service-requests/stored/services/${serviceId}`
        );
    }

    /**
     * Update reception code for a stored service
     */
    async updateServiceReceptionCode(
        serviceId: string,
        receptionCode?: string,
        sampleTypeName?: string
    ): Promise<ApiResponse<StoredService>> {
        const body: { receptionCode?: string; sampleTypeName?: string } = {};
        if (receptionCode) {
            body.receptionCode = receptionCode;
        }
        if (sampleTypeName) {
            body.sampleTypeName = sampleTypeName;
        }
        return this.request<StoredService>(
            `/service-requests/stored/services/${serviceId}/reception-code`,
            {
                method: 'PATCH',
                body: JSON.stringify(body),
            }
        );
    }

    /**
     * Update flag for a stored service request
     */
    async updateStoredServiceRequestFlag(
        storedServiceReqId: string,
        flag: string
    ): Promise<ApiResponse<unknown>> {
        return this.request<unknown>(
            `/service-requests/stored/${storedServiceReqId}/flag`,
            {
                method: 'PATCH',
                body: JSON.stringify({ flag }),
            }
        );
    }

    /**
     * Update staining method for a stored service request
     */
    async updateServiceRequestStainingMethod(
        storedServiceReqId: string,
        stainingMethodId: string
    ): Promise<ApiResponse<unknown>> {
        return this.request<unknown>(
            `/service-requests/stored/${storedServiceReqId}/staining-method`,
            {
                method: 'PATCH',
                body: JSON.stringify({ stainingMethodId }),
            }
        );
    }

    async updateStoredServiceRequestNumOfBlock(
        storedServiceReqId: string,
        numOfBlock: string | number
    ): Promise<ApiResponse<unknown>> {
        return this.request<unknown>(
            `/service-requests/stored/${storedServiceReqId}/num-of-block`,
            {
                method: 'PATCH',
                body: JSON.stringify({ numOfBlock }),
            }
        );
    }

    async saveServiceResult(
        serviceId: string,
        data: {
            resultValue?: number;
            resultValueText?: string;
            resultText?: string;
            resultDescription?: string;
            resultConclude?: string;
            resultNote?: string;
            resultNotes?: string;
            resultComment?: string;
            resultStatus?: 'NORMAL' | 'ABNORMAL' | 'CRITICAL';
            resultName?: string;
        }
    ): Promise<ApiResponse> {
        return this.request(
            `/service-requests/stored/services/${serviceId}/result`,
            {
                method: 'PATCH',
                body: JSON.stringify(data),
            }
        );
    }

    /**
     * Lấy kết quả dịch vụ bằng GET method
     * @param serviceId ID của service
     * @returns Promise<ApiResponse<ServiceResult>>
     */
    async getServiceResult(
        serviceId: string
    ): Promise<ApiResponse<ServiceResult>> {
        return this.request<ServiceResult>(
            `/service-requests/stored/services/${serviceId}/result`
        );
    }

    /**
     * Gọi API POST /api/v1/service-requests/stored/services/{serviceId}/document-id
     * Cập nhật document ID cho service sau khi ký số
     * @param serviceId ID của service
     * @param documentId ID của document từ EMR Sign
     * @returns Promise<ApiResponse>
     */
    async patchServiceRequestDocumentId(
        serviceId: number | string,
        documentId: number | string | null
    ): Promise<ApiResponse> {
        return this.request(
            `/service-requests/stored/services/${serviceId}/document-id`,
            {
                method: 'PATCH',
                body: JSON.stringify({ documentId }),
            }
        );
    }

    async getWorkflowStates(params?: {
        limit?: number;
        offset?: number;
        isActive?: number;
        IsSelected?: number;
        order?: 'ASC' | 'DESC';
        orderBy?: 'stateOrder' | 'stateName';
    }): Promise<ApiResponse<{
        items: Array<{
            id: string;
            stateCode: string;
            stateName: string;
            stateDescription: string;
            stateOrder: number;
            canSkip: number;
            requiresApproval: number;
            isActive: number;
        }>;
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>> {
        const queryParams = new URLSearchParams();

        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
        if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params?.IsSelected !== undefined) queryParams.append('isSelected', params.IsSelected.toString());
        if (params?.order) queryParams.append('order', params.order);
        if (params?.orderBy) queryParams.append('orderBy', params.orderBy);

        return this.request(`/workflow-states?${queryParams.toString()}`);
    }

    async getWorkflowHistory(params: {
        roomId: string;
        stateId?: string;
        roomType?: 'actionRoomId' | 'currentRoomId' | 'transitionedByRoomId';
        stateType?: 'toStateId' | 'fromStateId';
        isCurrent?: number;
        timeType?: 'actionTimestamp' | 'startedAt' | 'completedAt' | 'currentStateStartedAt';
        fromDate?: string;
        toDate?: string;
        limit?: number;
        offset?: number;
        order?: 'ASC' | 'DESC';
        orderBy?: 'actionTimestamp' | 'createdAt' | 'startedAt';
        code?: string; // Gộp receptionCode và hisServiceReqCode thành một trường
        flag?: string;
        patientName?: string;
        // Deprecated: sử dụng code thay thế
        hisServiceReqCode?: string;
        receptionCode?: string;
    }): Promise<ApiResponse<{
        items: Array<{
            id: string;
            storedServiceReqId: string;
            createdAt?: string;
            numOfBlock?: string | number;
            roomName?: string;
            serviceRequest?: {
                id?: string;
                hisServiceReqCode?: string;
                serviceReqCode?: string;
                patientName?: string;
                patientCode?: string;
                patientGenderName?: string;
                receptionCode?: string;
            };
            storedServiceRequest?: {
                id?: string;
                numOfBlock?: string | number;
            };
        }>;
        pagination: {
            total: number;
            limit: number;
            offset: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>> {
        const queryParams = new URLSearchParams();

        // Required params
        queryParams.append('roomId', params.roomId);
        if (params.stateId) queryParams.append('stateId', params.stateId);

        // Optional params
        if (params.roomType) queryParams.append('roomType', params.roomType);
        if (params.stateType) queryParams.append('stateType', params.stateType);
        if (params.isCurrent !== undefined) queryParams.append('isCurrent', params.isCurrent.toString());
        if (params.timeType) queryParams.append('timeType', params.timeType);
        if (params.fromDate) queryParams.append('fromDate', params.fromDate);
        if (params.toDate) queryParams.append('toDate', params.toDate);
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.offset) queryParams.append('offset', params.offset.toString());
        if (params.order) queryParams.append('order', params.order);
        if (params.orderBy) queryParams.append('orderBy', params.orderBy);
        // Gộp receptionCode và hisServiceReqCode thành code
        if (params.code) {
            queryParams.append('code', params.code);
        } else {
            // Backward compatibility: nếu không có code, gộp từ hisServiceReqCode và receptionCode
            const code = [params.hisServiceReqCode, params.receptionCode].filter(Boolean).join(',') || '';
            if (code) {
                queryParams.append('code', code);
            }
            // Không gửi hisServiceReqCode và receptionCode riêng nữa vì API không chấp nhận
        }
        if (params.flag) queryParams.append('flag', params.flag);
        if (params.patientName) queryParams.append('patientName', params.patientName);

        return this.request(
            `/workflow-history/by-room-and-state?${queryParams.toString()}`
        );
    }

    async transitionWorkflow(body: {
        storedServiceReqId: string;
        toStateId: string;
        actionType: 'START' | 'COMPLETE' | 'PAUSE' | 'RESUME' | 'CANCEL' | 'SKIP';
        currentUserId?: string;
        currentDepartmentId?: string;
        currentRoomId?: string;
        notes?: string;
        attachmentUrl?: string;
        metadata?: Record<string, any>;
    }): Promise<ApiResponse<{
        id: string;
        storedServiceReqId: string;
        fromStateId: string | null;
        toStateId: string;
        actionType: string;
        actionTimestamp: string;
        currentStateStartedAt: string;
        notes?: string;
    }>> {
        return this.request('/workflow-history/transition', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }

    async deleteWorkflowHistory(id: string): Promise<ApiResponse> {
        return this.request(`/workflow-history/${id}`, {
            method: "DELETE",
        });
    }

    /**
     * Xóa workflow history bằng toStateId và storedServiceReqId
     * DELETE /workflow-history/by-state-and-request?toStateId=xxx&storedServiceReqId=xxx
     */
    async deleteWorkflowHistoryByStateAndRequest(
        toStateId: string,
        storedServiceReqId: string
    ): Promise<ApiResponse> {
        const queryParams = new URLSearchParams();
        queryParams.append('toStateId', toStateId);
        queryParams.append('storedServiceReqId', storedServiceReqId);
        
        return this.request(
            `/workflow-history/by-state-and-request?${queryParams.toString()}`,
            {
                method: "DELETE",
            }
        );
    }

    // ========== USER ROOM ENDPOINTS ==========

    /**
     * Gán phòng cho user
     * POST /user-rooms/users/:userId/rooms
     */
    async assignRoomsToUser(
        userId: string,
        request: AssignRoomsRequest
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/user-rooms/users/${userId}/rooms`,
            {
                method: 'POST',
                body: JSON.stringify(request),
            }
        );
    }

    /**
     * Gỡ phòng khỏi user
     * DELETE /user-rooms/users/:userId/rooms/:roomId
     */
    async removeRoomFromUser(
        userId: string,
        roomId: string
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/user-rooms/users/${userId}/rooms/${roomId}`,
            {
                method: 'DELETE',
            }
        );
    }

    /**
     * Cập nhật phân quyền phòng
     * PUT /user-rooms/:userRoomId
     */
    async updateUserRoom(
        userRoomId: string,
        request: UpdateUserRoomRequest
    ): Promise<ApiResponse<{ message: string }>> {
        return this.request<{ message: string }>(
            `/user-rooms/${userRoomId}`,
            {
                method: 'PUT',
                body: JSON.stringify(request),
            }
        );
    }

    /**
     * Lấy danh sách phân quyền phòng
     * GET /user-rooms
     */
    async getUserRooms(
        filters?: GetUserRoomsFilters
    ): Promise<ApiResponse<{
        items: UserRoom[];
        total: number;
        limit: number;
        offset: number;
    }>> {
        const params = new URLSearchParams();
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
        }
        const queryString = params.toString();
        return this.request<{
            items: UserRoom[];
            total: number;
            limit: number;
            offset: number;
        }>(`/user-rooms${queryString ? `?${queryString}` : ""}`);
    }

    /**
     * Lấy danh sách phòng của user
     * GET /user-rooms/users/:userId
     */
    async getUserRoomsByUserId(
        userId: string
    ): Promise<ApiResponse<UserRoom[]>> {
        return this.request<UserRoom[]>(`/user-rooms/users/${userId}`);
    }

    /**
     * Lấy danh sách phòng của user hiện tại
     * GET /user-rooms/my-rooms
     */
    async getMyUserRooms(): Promise<ApiResponse<UserRoom[]>> {
        return this.request<UserRoom[]>("/user-rooms/my-rooms");
    }

    /**
     * Lấy thông tin phân quyền phòng
     * GET /user-rooms/:userRoomId
     */
    async getUserRoomById(
        userRoomId: string
    ): Promise<ApiResponse<UserRoom>> {
        return this.request<UserRoom>(`/user-rooms/${userRoomId}`);
    }

    /**
     * Kiểm tra quyền truy cập phòng
     * GET /user-rooms/check/:userId/:roomId
     */
    async checkUserRoomAccess(
        userId: string,
        roomId: string
    ): Promise<ApiResponse<{
        userId: string;
        roomId: string;
        hasAccess: boolean;
        message: string;
    }>> {
        return this.request<{
            userId: string;
            roomId: string;
            hasAccess: boolean;
            message: string;
        }>(`/user-rooms/check/${userId}/${roomId}`);
    }

}

export const apiClient = new ApiClient();
