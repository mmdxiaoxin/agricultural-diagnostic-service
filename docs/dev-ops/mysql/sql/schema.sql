create table crop
(
    id             int auto_increment
        primary key,
    createdAt      datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt      datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    name           varchar(50)                              not null comment '作物名称',
    scientificName varchar(100)                             null comment '学名',
    growthStage    varchar(50)                              null comment '生长阶段',
    cropType       varchar(50)                              null comment '作物类型',
    imageUrl       varchar(255)                             null comment '作物图片',
    alias          varchar(100)                             null comment '作物别名',
    description    varchar(1000)                            null comment '作物描述',
    origin         varchar(100)                             null comment '产地',
    growthHabits   varchar(500)                             null comment '作物生长习性',
    growthCycle    varchar(100)                             null comment '作物生长周期',
    suitableArea   varchar(200)                             null comment '适宜种植区域',
    suitableSeason varchar(100)                             null comment '适宜种植季节',
    suitableSoil   varchar(200)                             null comment '适宜种植土壤',
    constraint IDX_3b0092fe001d72938594cb32bd
        unique (name)
);

create table dataset
(
    id          int auto_increment
        primary key,
    createdAt   datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    name        varchar(255)                             not null,
    description text                                     null,
    access      varchar(25) default 'private'            not null,
    createdBy   int                                      not null,
    updatedBy   int                                      not null
);

create index dataset_user_id_fk
    on dataset (createdBy);

create index dataset_user_id_fk_2
    on dataset (updatedBy);

create table diagnosis_support
(
    id          int auto_increment
        primary key,
    createdAt   datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    `key`       varchar(50)                              not null comment '配置项',
    value       json                                     not null comment '配置值',
    description varchar(200)                             not null comment '配置描述'
);

create table disease
(
    id              int auto_increment
        primary key,
    createdAt       datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt       datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    name            varchar(255)                             not null comment '病害名称',
    alias           text                                     null comment '别名',
    cropId          int                                      null,
    cause           text                                     null comment '病害原因',
    transmission    text                                     null comment '传播途径',
    difficultyLevel varchar(20)                              null comment '防治难度等级',
    constraint IDX_8d91a7044538803aa90c0432ff
        unique (name),
    constraint FK_e106458dd1f0e5905637132bcff
        foreign key (cropId) references crop (id)
            on delete cascade
);

create table diagnosis_rule
(
    id        int auto_increment
        primary key,
    createdAt datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    diseaseId int                                      not null,
    config    json                                     not null comment '诊断规则配置',
    weight    int         default 1                    not null comment '规则权重',
    constraint FK_b86736b47c77032493ca8e50530
        foreign key (diseaseId) references disease (id)
            on delete cascade
);

create table environment_factor
(
    id           int auto_increment
        primary key,
    createdAt    datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt    datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    diseaseId    int                                      not null,
    factor       varchar(50)                              not null comment '环境因素',
    optimalRange varchar(100)                             not null comment '最佳范围',
    constraint FK_48cb7c350bd141a6452f7b61991
        foreign key (diseaseId) references disease (id)
            on delete cascade
);

create table file
(
    id               int auto_increment
        primary key,
    createdAt        datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt        datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    originalFileName varchar(255)                             not null,
    storageFileName  varchar(255)                             not null,
    filePath         text                                     not null,
    fileSize         bigint                                   not null,
    fileType         varchar(100)                             not null,
    fileMd5          char(32)                                 not null,
    access           varchar(30) default 'private'            not null,
    createdBy        int                                      not null,
    updatedBy        int                                      not null,
    version          int         default 1                    not null
);

create table datasets_files
(
    datasetId int not null,
    fileId    int not null,
    primary key (datasetId, fileId),
    constraint FK_37f8fd4ded1db4f7494879df3ba
        foreign key (fileId) references file (id)
            on delete cascade,
    constraint FK_ab3b647aa2cf33a9bf55e992063
        foreign key (datasetId) references dataset (id)
            on update cascade on delete cascade
);

create index IDX_37f8fd4ded1db4f7494879df3b
    on datasets_files (fileId);

create index IDX_ab3b647aa2cf33a9bf55e99206
    on datasets_files (datasetId);

create table diagnosis_history
(
    id              int auto_increment
        primary key,
    createdAt       datetime(6)                                         default CURRENT_TIMESTAMP(6) not null,
    updatedAt       datetime(6)                                         default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    fileId          int                                                                              null,
    diagnosisResult json                                                                             null,
    status          enum ('pending', 'success', 'failed', 'processing') default 'pending'            not null comment '状态',
    createdBy       int                                                                              not null comment '创建者',
    updatedBy       int                                                                              not null comment '更新者',
    version         int                                                                              not null comment '版本号',
    constraint REL_f0971ea99ddc4183f1e2b34dfe
        unique (fileId),
    constraint FK_f0971ea99ddc4183f1e2b34dfee
        foreign key (fileId) references file (id)
            on delete set null
);

create table diagnosis_feedback
(
    id              int auto_increment
        primary key,
    createdAt       datetime(6)                                            default CURRENT_TIMESTAMP(6) not null,
    updatedAt       datetime(6)                                            default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    diagnosisId     int                                                                                 null comment '诊断历史ID',
    feedbackContent text                                                                                not null comment '用户反馈内容',
    additionalInfo  json                                                                                null comment '用户提供的补充信息',
    status          enum ('pending', 'processing', 'resolved', 'rejected') default 'pending'            not null comment '反馈状态',
    expertId        int                                                                                 null comment '处理专家ID',
    expertComment   text                                                                                null comment '专家处理意见',
    correctedResult json                                                                                null comment '专家修正的诊断结果',
    createdBy       int                                                                                 not null comment '创建者',
    updatedBy       int                                                                                 not null comment '更新者',
    constraint FK_d894f07e43bb7ea0fb362ea528f
        foreign key (diagnosisId) references diagnosis_history (id)
            on delete cascade
);

create index diagnosis_feedback_created_by_idx
    on diagnosis_feedback (createdBy);

create index diagnosis_feedback_diagnosis_id_idx
    on diagnosis_feedback (diagnosisId);

create index diagnosis_history_created_by_idx
    on diagnosis_history (createdBy);

create index diagnosis_history_file_id_idx
    on diagnosis_history (fileId);

create table diagnosis_log
(
    id          int auto_increment
        primary key,
    diagnosisId int                                                               null,
    level       enum ('debug', 'info', 'warn', 'error') default 'info'            not null,
    message     text                                                              not null,
    metadata    json                                                              null,
    createdAt   timestamp                               default CURRENT_TIMESTAMP not null,
    constraint FK_68487630354ae123bb6dcdf73d2
        foreign key (diagnosisId) references diagnosis_history (id)
            on delete cascade
);

create index IDX_1796f29bbbe3f0ad8db4dba8ec
    on diagnosis_log (diagnosisId, createdAt);

create index file_user_id_fk
    on file (createdBy);

create index file_user_id_fk_2
    on file (updatedBy);

create table menu
(
    id       int auto_increment
        primary key,
    icon     varchar(255)  not null,
    title    varchar(255)  not null,
    path     varchar(255)  not null,
    sort     int default 0 not null,
    parentId int           null,
    isLink   varchar(255)  null,
    constraint FK_23ac1b81a7bfb85b14e86bd23a5
        foreign key (parentId) references menu (id)
);

create table remote_service
(
    id          int auto_increment
        primary key,
    createdAt   datetime(6)                                      default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6)                                      default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    serviceName varchar(100)                                                                  not null comment '服务名称',
    serviceType varchar(50)                                                                   null comment '服务类型',
    description text                                                                          null,
    status      enum ('active', 'inactive', 'under_maintenance') default 'active'             not null
);

create table remote_service_config
(
    id          int auto_increment
        primary key,
    createdAt   datetime(6)                 default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6)                 default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    name        varchar(100)                                             not null comment '配置名称',
    description text                                                     null,
    config      json                                                     not null,
    status      enum ('active', 'inactive') default 'active'             not null,
    serviceId   int                                                      not null,
    constraint FK_f56e2ab124575fdc444cd3755df
        foreign key (serviceId) references remote_service (id)
);

create table remote_service_interface
(
    id          int auto_increment
        primary key,
    createdAt   datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    name        varchar(100)                             not null comment '接口名称',
    description varchar(200)                             null comment '接口描述',
    type        varchar(50)                              not null comment '接口类型',
    url         varchar(500)                             not null comment '接口访问地址',
    config      json                                     not null,
    serviceId   int                                      not null,
    constraint FK_5dc4d9c6ea51881f772a51d68ff
        foreign key (serviceId) references remote_service (id)
);

create table role
(
    id        int auto_increment
        primary key,
    createdAt datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    name      varchar(50)                              not null comment '角色名称',
    alias     varchar(100)                             null comment '角色别名',
    constraint IDX_ae4578dcaed5adff96595e6166
        unique (name)
);

create table roles_menus
(
    menu_id int not null,
    role_id int not null,
    primary key (menu_id, role_id),
    constraint FK_27c2cb004a5b2a8f56455898310
        foreign key (role_id) references role (id),
    constraint FK_ff8168f42cee8b403f7f163986b
        foreign key (menu_id) references menu (id)
            on update cascade on delete cascade
);

create index IDX_27c2cb004a5b2a8f5645589831
    on roles_menus (role_id);

create index IDX_ff8168f42cee8b403f7f163986
    on roles_menus (menu_id);

create table symptom
(
    id          int auto_increment
        primary key,
    createdAt   datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt   datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    diseaseId   int                                      not null,
    description text                                     not null comment '症状描述',
    imageUrl    varchar(500)                             null comment '症状图片',
    stage       varchar(50)                              null comment '症状阶段',
    constraint FK_d60aac8bd02ce7cb782007ec3db
        foreign key (diseaseId) references disease (id)
            on delete cascade
);

create table treatment
(
    id                  int auto_increment
        primary key,
    createdAt           datetime(6) default CURRENT_TIMESTAMP(6)                not null,
    updatedAt           datetime(6) default CURRENT_TIMESTAMP(6)                not null on update CURRENT_TIMESTAMP(6),
    diseaseId           int                                                     not null,
    type                enum ('chemical', 'biological', 'physical', 'cultural') not null comment '防治措施类型',
    method              text                                                    not null comment '防治措施',
    recommendedProducts text                                                    null comment '推荐产品',
    precautions         text                                                    null comment '注意事项',
    constraint FK_247fa934d7ca369c6c2e9d94bb4
        foreign key (diseaseId) references disease (id)
            on delete cascade
);

create table user
(
    id        int auto_increment
        primary key,
    createdAt datetime(6) default CURRENT_TIMESTAMP(6) not null,
    updatedAt datetime(6) default CURRENT_TIMESTAMP(6) not null on update CURRENT_TIMESTAMP(6),
    email     varchar(100)                             null comment '邮箱',
    username  varchar(50)                              null comment '用户名',
    password  varchar(100)                             not null comment '密码',
    status    tinyint     default 0                    not null,
    constraint IDX_78a916df40e02a9deb1c4b75ed
        unique (username),
    constraint IDX_e12875dfb3b1d92d7d7c5377e2
        unique (email)
);

create table profile
(
    id      int auto_increment
        primary key,
    gender  tinyint default 0 not null,
    avatar  varchar(500)      null,
    name    varchar(50)       null,
    phone   varchar(20)       null,
    address varchar(200)      null,
    userId  int               null,
    constraint REL_a24972ebd73b106250713dcddd
        unique (userId),
    constraint FK_a24972ebd73b106250713dcddd9
        foreign key (userId) references user (id)
);

create table users_roles
(
    userId int not null,
    roleId int not null,
    primary key (userId, roleId),
    constraint FK_4fb14631257670efa14b15a3d86
        foreign key (roleId) references role (id),
    constraint FK_776b7cf9330802e5ef5a8fb18dc
        foreign key (userId) references user (id)
            on update cascade on delete cascade
);

create index IDX_4fb14631257670efa14b15a3d8
    on users_roles (roleId);

create index IDX_776b7cf9330802e5ef5a8fb18d
    on users_roles (userId);

