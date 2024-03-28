import { Component, Input, OnInit, ChangeDetectorRef, ElementRef,
  Output, EventEmitter, AfterViewInit, ViewEncapsulation, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DynamicFormControlComponent, DynamicFormControlLayout, DynamicFormLayout, DynamicTableModel,
  DynamicFormLayoutService, DynamicFormValidationService, dayjs, cloneDeep, DynamicFormService,
} from '@athena/dynamic-core';
import {
  DynamicReportProjectQuestionModel
} from '../../model/report-project-question-bulletin-board/report-project-question-bulletin-board.model';
import { ReportProjectQuestionService } from './report-project-question-bulletin-board.service';
import { CommonService } from '../../service/common.service';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  encapsulation: ViewEncapsulation.None, // 这里需要设置成None
  selector: 'app-report-project-question-bulletin-board',
  templateUrl: './report-project-question-bulletin-board.component.html',
  styleUrls: ['./report-project-question-bulletin-board.component.less'],
  providers: [ReportProjectQuestionService, CommonService]
})

/**
 * 项目问题看板
 */
export class ReportProjectQuestionComponent extends DynamicFormControlComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() formLayout: DynamicFormLayout;
  @Input() group: FormGroup;
  @Input() layout: DynamicFormControlLayout;
  @Input() model: DynamicReportProjectQuestionModel;

  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() blur: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() change: EventEmitter<any> = new EventEmitter();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() focus: EventEmitter<any> = new EventEmitter();

  private submitFormHandle$ = new Subject<number>();
  private getPartialDataHandle$ = new Subject<number>();

  public dynamicGroup: FormGroup;
  public dynamicLayout: DynamicFormLayout;
  public dynamicModel: DynamicTableModel[];

  validateForm: FormGroup = this.fb.group({
    projectInfo: [{}],
    project_name: [null],
    questionType: [null],
    questionLeader: [null],
    questionProposer: [null],
    startToEndDate: [null, [Validators.required]]
  });
  startTime: string = '';
  endTime: string = '';

  inputGroupObj = {
    label: this.translateService.instant('dj-pcc-项目'),
    placeholder: this.translateService.instant('dj-pcc-请选择项目'),
    transparentTransmissionStyle: {
      width: '332px',
      height: '28px',
      background: '#ffffff',
      borderRadius: '2px'
    }
  }

  openWindowObj = {
    title: this.translateService.instant('dj-pcc-请选择项目'),
    serviceName: 'bm.pisc.project.get',
    dataKeys: ['project_no'],
    paras: {},
    roleAttention: [
      'project_no',
      'project_name',
      'project_leader_code',
      'project_leader_name',
    ]
  }

  questionTypeList: any = [];
  questionLeaderList: any = [];
  questionProposerList: any = [];
  question_list_info: any = [];
  thenList: any = [];
  nowList: any = [];
  noList: any = [];
  okList: any = [];
  tableData: any = [];
  total: number = 0;
  isShowSpin: boolean = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    protected changeRef: ChangeDetectorRef,
    protected layoutService: DynamicFormLayoutService,
    protected validationService: DynamicFormValidationService,
    protected elementRef: ElementRef,
    public commonService: CommonService,
    public reportProjectQuestionService: ReportProjectQuestionService,
    private translateService: TranslateService,
    private formService: DynamicFormService,
  ) {
    super(layoutService, validationService, changeRef, elementRef);
  }

  ngOnInit(): void {
    this.validateForm.get('startToEndDate')
      .setValue([dayjs(new Date((new Date()).setDate(new Date().getDate() - 30))).format('YYYY-MM-DD'),
        dayjs(new Date()).format('YYYY-MM-DD')]);
    this.getTableData(true);
    this.submitForm();
    this.getPartialDataSubject();
    try {
      // 强依赖平台dom,如果平台dom结构变动，这边也需要更改
      const main = document.getElementsByClassName('report-project-question-bulletin-board')[0];
      this.setTableHeight(main);
      const resizeObserver = new ResizeObserver(entries => {
        this.setTableHeight(main);
      });
      resizeObserver.observe(main);
    }catch (e) {
      console.log(e);
    }
    this.changeRef.markForCheck();
  }

  ngOnDestroy() { }

  ngAfterViewInit() {
    this.elementRef.nativeElement.style.width = '100%';
    this.elementRef.nativeElement.style.height = '100%';
    this.elementRef.nativeElement.style.display = 'block';
    this.elementRef.nativeElement.style.overflow = 'auto';
    const parentNode = this.elementRef.nativeElement.parentNode?.parentNode?.parentNode;
    if (parentNode) {
      const fullscreen = parentNode.getElementsByClassName('fullscreen-btn');
      const appCommUseItemShow = parentNode.getElementsByTagName('app-comm-use-item-show');
      if (fullscreen) {
        fullscreen[0].style.cssText = 'display: none !important;';
      }
      if (appCommUseItemShow) {
        const isCommonUse = appCommUseItemShow[0].getElementsByClassName('is-common-use');
        if (isCommonUse) {
          isCommonUse[0].style.cssText = 'display: none !important;';
        }
      }
    }

    this.getDataList('bmd.basc.question.type.get', {}).then(data => {
      this.questionTypeList = data?.question_type_info ?? [];
    });
    this.getDataList('bm.pisc.project.employee.get', {search_type: '1', project_info: [{}]}).then(data => {
      this.questionLeaderList = data?.project_member_info ?? [];
      this.questionProposerList = data?.project_member_info ?? [];
    });
  }

  nzOnCalendarChange($event) {
    if ($event.length === 2 && $event[0] && $event[1]) {
      this.validateForm.get('startToEndDate').setValue([dayjs($event[0]).format('YYYY-MM-DD'), dayjs($event[1]).format('YYYY-MM-DD')]);
    }
  }

  setTableHeight(main){
    const inputBar = document.getElementsByClassName('search-input-bar')[0];
    const imageBar = document.getElementsByClassName('search-image-bar')[0];
    if (document.getElementById('pcc-search-retun-data')) {
      document.getElementById('pcc-search-retun-data').style.height =
        main.clientHeight - inputBar.clientHeight - imageBar.clientHeight - 16 + 'px';
    }
  }

  getTimeInterval(start: Date, end: Date) {
    let endDate: String = null;
    if (!end) {
      endDate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    } else {
      endDate = moment(end).format('YYYY-MM-DD HH:mm:ss');
    }
    const endTime = endDate.split(' ')[0] + ' 23:59:59';
    let currentDate: Date = new Date(); // 获取当前日期
    if (start) {
      currentDate = new Date(start);
    } else {
      currentDate.setDate(currentDate.getDate() - 30); // 将当前日期减去30天
    }
    const year = currentDate.getFullYear(); // 获取年份
    const month = currentDate.getMonth() + 1; // 获取月份（注意月份从0开始，需要加1）
    const day = currentDate.getDate(); // 获取日期
    // 格式化日期为字符串（例如：YYYY-MM-DD）
    const formattedDate = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    // 下面是获取30天前的零点和23.59.59点，并转时间戳
    const startTime = formattedDate + ' 00:00:00';
    this.startTime = startTime;
    this.endTime = endTime;
  }

  getTableData(isInit: boolean) {
    if (!isInit && (this.validateForm.value?.startToEndDate?.length < 2)) {
      return ;
    } else if (isInit) {
      this.getTimeInterval(null, null);
    } else if (this.validateForm.value?.startToEndDate?.length === 2) {
      this.getTimeInterval(this.validateForm.value.startToEndDate[0], this.validateForm.value.startToEndDate[1]);
    }
    this.isShowSpin = true;
    const search_info = [{
      order: 1,
      search_field: 'question_happen_datetime',
      search_operator: 'greater_equal',
      search_value: [this.startTime],
      logic: 'and'
    }, {
      order: 2,
      search_field: 'question_happen_datetime',
      search_operator: 'less_equal',
      search_value: [this.endTime],
    }];
    const question_list_info = [{
      app_project_no: this.validateForm.value.projectInfo?.project_no ?? null, // 应用项目编号
      question_type_no: this.validateForm.value.questionType?.question_type_no ?? null, // 问题类型编号
      process_person_no: this.validateForm.value.questionLeader?.employee_no ?? null,// 发起人编号
      initiator_no: this.validateForm.value.questionProposer?.employee_no ?? null // 处理人编号
    }];
    this.commonService.getInvData('bm.basc.project.question.list.get', { search_info, question_list_info }).subscribe((res): void => {
      if (res.data?.question_list_info && res.data?.question_list_info.length) {
        this.question_list_info = res.data?.question_list_info;
      } else {
        this.question_list_info = [];
      }
      this.tableData = this.question_list_info.length ? cloneDeep(this.question_list_info) : [];
      this.total = this.question_list_info.length ?? 0;
      this.classificationReturn();
      this.getTemplateJson();
      this.isShowSpin = false;
      this.changeRef.markForCheck();
    }, (err) => {
      this.tableData = [];
      this.total = 0;
      this.classificationReturn();
      this.getTemplateJson();
      this.isShowSpin = false;
      this.changeRef.markForCheck();
    });
  }

  getTemplateJson() {
    const model = cloneDeep(this.model);
    const templateJson = this.reportProjectQuestionService.templateJson(this.tableData, model);
    const initializedData = this.formService.initData(
      templateJson.layout as any,
      templateJson.pageData,
      templateJson.rules as any,
      templateJson.style,
      templateJson.content
    );
    this.dynamicLayout = initializedData.formLayout; // 样式
    this.dynamicModel = initializedData.formModel; // 组件数据模型
    this.dynamicGroup = initializedData.formGroup; // formGroup
    this.changeRef.markForCheck();
  }

  onChange(event: any): void {
    const { $event } = event;
    if ($event && $event.event === 'Reset' && $event.type === 'UPDATE') {
      this.getTemplateJson();
    }
  }

  classificationReturn() {
    if (!this.question_list_info?.length) {
      this.thenList = [];
      this.nowList = [];
      this.noList = [];
      this.okList = [];
      this.tableData = [];
      this.total = 0;
      return;
    }
    this.thenList = [];
    this.nowList = [];
    this.noList = [];
    this.okList = [];
    this.question_list_info.forEach(item => {
      // 状态： 1.已提醒；2.待处理；3.验收中；4.退回重办；5.待指派；6.指定结案；7.已转派；99.已完成
      switch(item.status) {
        case '2': {
          // 【待处理】SUM（查询结果.状态=2.待处理 or 4.退回重办）
          this.thenList.push(item);
          break;
        }
        case '3': {
          // 【验收中】SUM（查询结果.状态=3.验收中）
          this.nowList.push(item);
          break;
        }
        case '4': {
          // 【待处理】SUM（查询结果.状态=2.待处理 or 4.退回重办）
          this.thenList.push(item);
          break;
        }
        case '99': {
          // 【已完成】SUM（查询结果.状态=99.已完成）
          this.okList.push(item);
          break;
        }
        default: {
          break;
        }
      }
      // 【延期未完成】SUM（查询结果.是否延期未完成=True）
      if (item.is_postpone) {
        this.noList.push(item);
      }
    });
  }

  getPartialDataHandle(type): void {
    this.getPartialDataHandle$.next(type);
  }

  getPartialDataSubject() {
    this.getPartialDataHandle$.pipe(debounceTime(500)).subscribe(type => {
      this.getPartialData(type);
    });
  }

  getPartialData(type) {
    switch(type) {
      case 'then': {
        this.total = this.thenList.length ?? 0;
        this.tableData = cloneDeep(this.thenList);
        this.changeRef.markForCheck();
        break;
      }
      case 'now': {
        // 验收中
        this.total = this.nowList.length ?? 0;
        this.tableData = cloneDeep(this.nowList);
        this.changeRef.markForCheck();
        break;
      }
      case 'no': {
        // 延期未完成
        this.total = this.noList.length ?? 0;
        this.tableData = cloneDeep(this.noList);
        this.changeRef.markForCheck();
        break;
      }
      case 'ok': {
        this.total = this.okList.length ?? 0;
        this.tableData = cloneDeep(this.okList);
        this.changeRef.markForCheck();
        break;
      }
      default: {
        this.total = this.question_list_info.length ?? 0;
        this.tableData = cloneDeep(this.question_list_info);
        this.changeRef.markForCheck();
        break;
      }
    }
    this.getTemplateJson();
  }

  async getDataList(serviceName, param):Promise<any> {
    const res: any = await this.commonService.getInvData(serviceName, param).toPromise();
    return res.data;
  }

  resetForm() {
    this.validateForm.reset({
      projectInfo: {},
      project_name: null,
      questionType: null,
      questionLeader: null,
      questionProposer: null,
      startToEndDate: [
        dayjs(new Date((new Date()).setDate(new Date().getDate() - 30))).format('YYYY-MM-DD'),
        dayjs(new Date()).format('YYYY-MM-DD')
      ]
    });
  }

  submitFormHandle(): void {
    this.submitFormHandle$.next();
  }

  submitForm() {
    this.submitFormHandle$.pipe(debounceTime(500)).subscribe(res => {
      this.getTableData(false);
    });
  }

  translateWord(val: string): String {
    return this.translateService.instant(`dj-default-${val}`);
  }

  translateWordPcc(val: string): String {
    return this.translateService.instant(`dj-pcc-${val}`);
  }

}
