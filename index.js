import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Box, Fab, Tooltip, TextField, Chip } from '@material-ui/core';
import { IconButton } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import BackupIcon from '@material-ui/icons/Backup';
import Checkbox from '@mui/material/Checkbox';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Input from '@mui/material/Input';
import { MenuList, Paper, Popover } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { green, red } from '@material-ui/core/colors';
import { useSelector } from 'react-redux';
import { DatePicker } from '@material-ui/pickers';
import PageContainer from '@jumbo/components/PageComponents/layouts/PageContainer';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Axios from 'axios';
import axios from 'axios';
import qs from 'qs';
import LabelIcon from '@mui/icons-material/Label';
import Fade from 'react-reveal/Fade';
import { useDispatch } from 'react-redux';
import 'react-virtualized/styles.css';
import AddIcon from '@material-ui/icons/Add';
import InputAdornment from '@mui/material/InputAdornment';
import ExportIcon from '@material-ui/icons/SaveAlt';
import SearchIcon from '@material-ui/icons/Search';
import CloseIcon from '@material-ui/icons/Close';
import formData from 'form-data';
import { AgGridReact } from 'ag-grid-react';
import Menu from '@mui/material/Menu';
import MenuItem2 from '@mui/material/MenuItem';
import LabelComponent from '../../../../@common/Label/index';
import { showMessage } from '@services/utils';
import { MoreVert } from '@material-ui/icons';
import { withStyles } from '@material-ui/styles';
import moment from 'moment';
import AddNew from './AddNew';
import Duplicate from './Duplicate';
import BrowserSelect from './BrowserSelect';
import MoveToFolder from './MoveToFolder';
import Schedule from '../../ScheduleDialog';
import MultiRun from './MultiRun';
import { useEffect } from 'react';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import { useHistory } from 'react-router';
import Button from '@mui/material/Button';
import RunningStatus from './RunningStatus';
import { TestUtils } from './utils';
import { Edit, History, DeleteOutlined, Download, DriveFileMove, PlayArrow, EventNote, ContentCopy } from '@mui/icons-material';
import ImportExportIcon from '@material-ui/icons/ImportExport';
import ImportWeb from './ImportWeb/index'
import { webDateFilter } from "@redux/actions/constant"
import RunDetails from 'routes/App/RunDetails';


const MySwal = withReactContent(Swal);
const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;
const breadcrumbs = [];
const csvFileDownload = (data, name, extension) => {
  const FileDownload = require('js-file-download');
  FileDownload(data, `${name}.${extension}`);
}

const useStyles = makeStyles((theme) => ({
  deleteIcon: {
    '&:hover': {
      color: 'red',
    },
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
  },
  tableRowTitle: {
    color: theme.palette.text.primary,
    fontWeight: 600,
    lineHeight: 1.5,
  },
}));

const initialDialogState = {
  show: false,
  refreshData: false,
  showPerm: false,
  rowData: {},
};

const ListAll = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const [dialogState, setDialogState] = useState(initialDialogState);
  const [refereshData, setRefereshData] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [pageSize, setPageSize] = useState(10);
  const [pollReferesh, setPollReferesh] = useState(false);
  const [haveAnyRunning, setHaveAnyRunning] = useState(false);
  const [runningIds, setRunningIds] = useState([]);
  const [rowData, setRowData] = useState(undefined);
  const [showCreateDial, setShowCreateDial] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDuplicate, setShowDuplicate] = useState(false);
  const [showBrowserSelect, setShowBrowserSelect] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [showMultiRun, setShowMultiRun] = useState(false);
  const org = useSelector(({ org }) => org);
  const [selectedRows, setSelectedRows] = useState([]);
  const history = useHistory();
  const [moreOptions, setMoreOptions] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openAnchorEl, setOpenAnchorEl] = useState(false);
  const [anchorElExport, setAnchorElExport] = useState(null);
  const [rows, setRows] = useState([]);
  const [userFilter, setUserFilter] = useState([]);
  const [labels, setLabels] = useState(false);
  const [showImportWeb, SetshowImportWeb] = useState(false);
  const web_filter = useSelector(({ constant }) => constant.web_filter);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    f_user: [],
    f_name: '',
    passFail: '',
    search: '',
  });

  const [columnDefs, setColumnDefs] = useState([
    {
      headerName: '',
      field: 'check_box',
      maxWidth: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      sortable: false,
      suppressMenu: true,
      filter: false,
      pinned: false,
      suppressMovable: true,
    },
    {
      field: 'name',
      filter: 'agTextColumnFilter',
      headerName: 'Test Name',
      minWidth: 130,
      flex: 1,
      suppressMovable: true,
      cellRenderer: (row) => {
        const rowData = row.data;
        var TData = [];
        var tag = [];

        if (rowData.tags) {
          TData = rowData.tags;
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {rowData.data_driven && (
              <>
                <Tooltip title={'download csv file'}>
                  <span style={{ marginRight: '1vh' }}>
                    <Download
                      color={'#2f5704'}
                      onClick={() => {
                        exportCSVTest(rowData._id, rowData.name);
                      }}
                      style={{ fontSize: '1rem', cursor: 'pointer' }}
                    />
                  </span>
                </Tooltip>
                <Tooltip title={'Remove csv file'}>
                  <span style={{ marginRight: '.5vh' }}>
                    <DeleteOutlined
                      onClick={() => {
                        deleteCsvTest(rowData);
                      }}
                      className={classes.deleteIcon}
                      style={{ fontSize: '17px' }}
                    />
                  </span>
                </Tooltip>
              </>
            )}
            <span
              style={{ textDecorationLine: 'underline', cursor: 'pointer' }}
              onClick={() => {
                testEditorClick(rowData, true);
              }}>
              {rowData.name}
            </span>
            {Array.isArray(TData) &&
              TData.map((item) => {
                return (
                  <Tooltip title={item.label}>
                    <Chip
                      size="small"
                      variant="outlined"
                      style={{
                        width: '30px',
                        padding: '0px',
                        backgroundColor: item.color,
                        margin: '0px 1px',
                        fontSize: '12px',
                        height: '15px',
                      }}
                    />
                  </Tooltip>
                );
              })}
          </div>
        );
      },
    },
    {
      field: 'full_name',
      filter: 'agTextColumnFilter',
      headerName: 'Executed By',
      minWidth: 100,
      flex: 1,
      suppressMovable: true,
    },
    {
      field: 'created_at',
      filter: 'agTextColumnFilter',
      headerName: 'Creation Date',
      minWidth: 130,
      flex: 1,
      suppressMovable: true,
      cellRenderer: (row) => {
        const rowData = row.data;
        return <div> {rowData.created_at}</div>;
      },
    },
    {
      field: 'lastRun',
      filter: 'agTextColumnFilter',
      headerName: 'Last Run',
      minWidth: 130,
      flex: 1,
      suppressMovable: true,
      cellRenderer: (row) => {
        const rowData = row.data;
        return <div> {rowData.lastRun} </div>;
      },
    },
    {
      field: 'passfail',
      headerName: 'Pass / Fail',
      minWidth: 100,
      flex: 1,
      suppressMovable: true,
      cellRenderer: (rowData) => {
        let fail = rowData.data.total_fail;
        let pass = rowData.data.total_pass;

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Total Pass">
              <Box className={classes.tableRowTitle} fontSize={{ xs: 15, sm: 15 }} style={{ color: green[500] }}>
                {pass}
              </Box>
            </Tooltip>
            &nbsp;/&nbsp;
            <Tooltip title="Total Failed">
              <Box className={classes.tableRowTitle} fontSize={{ xs: 15, sm: 15 }} style={{ color: red[500] }}>
                {fail}
              </Box>
            </Tooltip>
            <h5 style={{ display: 'none' }}>{rowData.passfail}</h5>
          </div>
        );
      },
    },
    {
      field: 'successRate',
      headerName: 'Success Rate',
      minWidth: 120,
      flex: 1,
      suppressMovable: true,
      cellRenderer: (row) => {
        const rowData = row.data;
        let fail = rowData.total_fail;
        let pass = rowData.total_pass;
        let totalPassPercent = ((Number(pass) / (Number(pass) + Number(fail))) * 100).toFixed(2);
        let totalFailedPercent = ((Number(fail) / (Number(pass) + Number(fail))) * 100).toFixed(2);

        if (totalPassPercent === 'NaN') return <h5>Not Tested Yet</h5>;
        else
          return (
            <div
              style={{
                display: 'flex',
                width: '100%',
                justifyContent: 'center',
                height: '100%',
                alignItems: 'center',
                borderRadius: '10px',
              }}>
              <Tooltip title={`Total Passed ${totalPassPercent}%`}>
                <div style={{ width: `${totalPassPercent}%`, background: '#04ca49', height: '3vh' }}></div>
              </Tooltip>
              <Tooltip title={`Total Failed ${totalFailedPercent}%`}>
                <div style={{ width: `${totalFailedPercent}%`, background: '#a70505', height: '3vh' }}></div>
              </Tooltip>
              <h5 style={{ display: 'none' }}>{rowData.successRate}</h5>
            </div>
          );
      },
    },
    {
      field: 'teststatus',
      headerName: 'Status',
      minWidth: 100,
      flex: 1,
      suppressMovable: true,
      width: 50,
      cellRenderer: RunningStatus,
    },
    {
      field: 'action',
      headerName: 'Actions',
      width: 500,
      maxWidth: 200,
      data: [],
      suppressRowClickSelection: true,
      filter: false,
      cellRenderer: (row) => {
        const rowData = row.data;
        return (
          <Box display="flex" alignItems={'center'} style={{ marginTop: '3.5px' }}>
            <Tooltip title={'Run Test'}>
              <IconButton
                size="small"
                onClick={() => {
                  handlePopoverClose();
                  testExecute([rowData]);
                }}
                disabled={busy || row.data.is_running === true}>
                <PlayArrow />
              </IconButton>
            </Tooltip>
            <Tooltip title={'Schedule Test'}>
              <IconButton
                size="small"
                onClick={() => {
                  handlePopoverClose();
                  scheduleRowClick([rowData]);
                }}
                disabled={busy || rowData.is_running === true}>
                <EventNote />
              </IconButton>
            </Tooltip>

            <Tooltip title={'Test History'}>
              <IconButton
                size="small"
                onClick={() => {
                  handlePopoverClose();
                  historyClick([rowData]);
                }}
                disabled={busy || rowData.is_running === true}>
                <History />
              </IconButton>
            </Tooltip>
            {rowData.history !== null && (
              <Tooltip title={'Latest History'}>
                <IconButton
                  size="small"
                  onClick={() => {
                    handlePopoverClose();
                    latest_record(rowData);
                  }}
                  disabled={busy || rowData.is_running === true}>
                  <History />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={'Actions'}>
              <IconButton
                size="small"
                disabled={selectedRows.length > 0 || runningIds.includes(rowData._id) || rowData.is_running === true}
                onClick={(e) => {
                  handlePopoverOpen(e, rowData);
                }}>
                <MoreVert style={{ color: 'black' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
      cellRendererParams: {
        deleteClicked: function (field) {
          deleteRowClick(field);
        },
      },
    },
  ]);

  const defaultColDef = useMemo(() => {
    return {
      flex: 1,
      minWidth: 20,
      filter: false,
      resizable: true,
      sortable: true,
    };
  }, []);

  const statusBar = useMemo(() => {
    return {
      statusPanels: [
        { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
        { statusPanel: 'agTotalRowCountComponent', align: 'center' },
        { statusPanel: 'agFilteredRowCountComponent' },
        { statusPanel: 'agSelectedRowCountComponent' },
        { statusPanel: 'agAggregationComponent' },
      ],
    };
  }, []);

  const sleep = (timeout) => {
    return new Promise((resolve) => setTimeout(() => resolve(true), timeout));
  };

  const fetchData = async (page = 1, params) => {
    try {
      let data = await getData({
        orderBy: null,
        orderDirection: '',
        page: page,
        pageSize: pageSize,
        search: filters.search,
        status: 1,
        org_id: org._id,
        f_start: `${web_filter.start.getFullYear()}-${web_filter.start.getMonth() + 1}-${web_filter.start.getDate()}`,
        f_end: `${web_filter.end.getFullYear()}-${web_filter.end.getMonth() + 1}-${web_filter.end.getDate()}`,
        f_user: filters.f_user.join(),
        f_name: filters.f_name,
      });
      if (data?.data?.data.length === 0) {
        testGridRef.current.api.showNoRowsOverlay();
        params?.successCallback([], 0);
      }
      params.successCallback(TestUtils.parseTestsData(data?.data?.data || [], data.tempRunningIds), data?.data.count);
      testGridRef.current.api.hideOverlay();
    } catch (error) {
      params?.successCallback([], 0);
    }
  };

  const webTestData = () => {
    if (gridApi) {
      const dataSource = {
        getRows: (params) => {
          const page = params.request.endRow / pageSize;
          fetchData(page, params);
        },
      };
      gridApi.setServerSideDatasource(dataSource);
    }
  };

  useEffect(() => {
    webTestData();
  }, [gridApi, pageSize, JSON.stringify(filters), org, web_filter.start, web_filter.end]);

  const onGridReady = useCallback(async (paramsMain) => {
    setGridApi(paramsMain.api);
    paramsMain.api.setDomLayout('autoHeight');
    paramsMain.api.showLoadingOverlay();
  }, []);

  const testGridRef = useRef(null);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);

  const getFilterValue = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });

    setTimeout(() => {
      setRefereshData(true);
    }, 300);
  };

  useEffect(() => {
    const submitRequest = () => {
      try {
        let data = qs.stringify({
          org_id: org._id,
          search: '',
        });
        Axios.post('/user/list', data)
          .then((result) => {
            result = result.data;
            if (result.status) {
              result.data.map((data) => {
                data.title = data.full_name;
              });
              setUserFilter(result.data);
            }
          })
          .catch((e) => {
            setUserFilter([]);
          });
      } catch (e) {
        showMessage('error', e);
      }
    };
    submitRequest();
  }, []);

  const openExportDialog = Boolean(anchorElExport);
  const permissions = useSelector(({ permissions }) => permissions);

  useEffect(() => {
    setTimeout(() => {
      if (!pollReferesh && haveAnyRunning) {
        setPollReferesh(true);
      }
    }, 2000);
  }, [pollReferesh, haveAnyRunning]);

  const searchInputRef = useRef(null);
  const getData = (params) => {
    return new Promise((resolve, reject) => {
      if (permissions.list_test) {
        setRunningIds([]);
        let { page, pageSize, search } = params;
        let data = qs.stringify({
          search: filters.search,
          page,
          pageSize,
          status: 1,
          org_id: org._id,
          f_start: `${web_filter.start.getFullYear()}-${web_filter.start.getMonth() + 1}-${web_filter.start.getDate()}`,
          f_end: `${web_filter.end.getFullYear()}-${web_filter.end.getMonth() + 1}-${web_filter.end.getDate()}`,
          f_user: filters.f_user.join(),
          f_name: filters.f_name,
        });
        var config = {
          method: 'post',
          url: '/test',
          data: data,
        };

        let anyRunning = false;
        Axios(config)
          .then((ans) => {
            if (ans.data.status) {
              ans = ans.data;
              let tempRunningIds = [];
              ans.data.data.map((item) => {
                // modify the response key
                item.passfail = `${item.total_pass} Passed / ${item.total_fail} Failed`;
                item.teststatus = item.is_running ? 'Running' : 'Idle';
                let totalPassPercent = (
                  (Number(item.total_pass) / (Number(item.total_pass) + Number(item.total_fail))) *
                  100
                ).toFixed(2);
                let totalFailedPercent = (
                  (Number(item.total_fail) / (Number(item.total_pass) + Number(item.total_fail))) *
                  100
                ).toFixed(2);
                item.successRate =
                  totalPassPercent === 'NaN'
                    ? 'Not Tested Yet'
                    : `${totalPassPercent}%  Passed /${totalFailedPercent}% Failed`;
                item.created_at = moment.utc(item.created_at).local(true).format('DD/MM/YYYY');
                item.lastRun =
                  item.history && item.history.created_at
                    ? moment(item.history.created_at).format('DD/MM/YYYY hh:mm a')
                    : 'Not Tested Yet';
                if (item.is_running) {
                  anyRunning = true;
                  tempRunningIds.push(item._id);
                }
              });

              if (anyRunning) {
                setHaveAnyRunning(true);
                setRunningIds(tempRunningIds);
              }
              resolve({ data: ans.data, tempRunningIds });
            } else {
              reject(ans.data.message);
            }
          })
          .catch((e) => {
            reject(e);
          });
      } else {
        resolve([]);
      }
    });
  };
  const historyClick = async (selectedRows) => {
    setTimeout(() => {
      history.push('testruns/' + selectedRows[0]._id);
    }, 10);
  };

  const latest_record = (rowData) => {
    try {

      console.log("Clicked");
      history.push('rundetail/' + rowData.history._id)
    } catch (error) {
      console.log(error);
    }
  }


  const testEditorClick = async (data, isEdit) => {
    setTimeout(() => {
      try {
        isEdit && history.push('test-editor/' + data._id);
        !isEdit && history.push('editor');
      } catch (error) {
        console.log(error);
      }
    }, 10);
  };

  const duplicateRowClick = async (data) => {
    setTimeout(() => {
      setRowData(data);
      setShowDuplicate(true);
    }, 10);
  };

  const scheduleRowClick = async (data) => {
    setTimeout(() => {
      setRowData(data);
      setShowSchedule(true);
    }, 10);
  };

  const moveFolderRowClick = async (data) => {
    setTimeout(() => {
      setRows(data);
      setShowMove(true);
    }, 10);
  };

  const testExecute = async (data) => {
    var temp = [];
    for (let i = 0; i < data.length; i++) {
      temp.push({ ...data[i], name: { name: data[i].name, type: 1 } });
    }
    setRows(temp);
    setTimeout(() => {
      setShowMultiRun(true);
    }, 10);
  };

  const deleteCall = (data) => {
    return new Promise((resolve, reject) => {
      Axios.post('test/delete', data)
        .then((ans) => {
          if (ans.data.status) {
            resolve(ans.data.message);
          } else {
            reject(ans.data.message);
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const handleExportMenuClose = () => {
    setAnchorElExport(null);
  };

  const handleExportTableToCsv = () => {
    if (testGridRef) {
      const params = {
        skipHeader: false,
        columnGroups: false,
        skipFooters: true,
        skipGroups: true,
        skipPinnedTop: true,
        skipPinnedBottom: true,
        allColumns: false,
        onlySelected: false,
        processHeaderCallback: (params) => {
          // skiped header column when export in csv
          if (params.column.colId === 'action') return undefined;
          if (params.column.colId === 'check_box') return undefined;
          return params.column.getColDef().headerName;
        },
        processCellCallback: (params) => {
          // skiped  column data when export in csv
          if (params.column.colId === 'action') return undefined;
          if (params.column.colId === 'check_box') return undefined;
          return params.value;
        },
      };
      testGridRef.current.api.exportDataAsCsv(params);
    }
  };

  const handleExportTableToExcel = () => {
    testGridRef.current.api.exportDataAsExcel();
  };

  const deleteRowClick = async (rowData) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: 'Do You Want To Remove This Test',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete it !',
      cancelButtonText: 'No, cancel !',
      reverseButtons: true,
    }).then(async (result) => {
      if (result.value) {
        try {
          const result = await deleteCall({ test_id: rowData._id, org_id: org._id });

          setRefereshData(true);
        } catch (e) {
          showMessage('error', e);
          setRefereshData(true);
        }
      }
    });
  };
  const updateTestRequest = (params) => {
    try {
      params = qs.stringify(params);
      let config = {
        method: 'put',
        url: 'test',
        data: params,
      };

      axios(config)
        .then((ans) => {
          setBusy(false);
          let data = ans.data;
          if (data.status) {
            showMessage('success', data);
            setRefereshData(true);
          } else {
            showMessage('error', data.message);
            setRefereshData(true);
          }
        })
        .catch((e) => {
          setBusy(false);
          showMessage('error', e.message);
        });
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const deleteCsvTest = async (rowData) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: 'Do You Want To Remove Csv',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it !',
      cancelButtonText: 'No, cancel !',
      reverseButtons: true,
    }).then(async (result) => {
      if (result.value) {
        try {
          let { name, description, base_url } = rowData;
          let data = {
            name,
            description,
            base_url,
            script: '',
            test_id: rowData._id,
            org_id: org._id,
            run_type: rowData.config ? rowData.config.run_type : '',
            instance: rowData.config ? rowData.config.instance : '',
            data_driven: false,
            attachment: null,
            browsers: rowData.config ? rowData.config.browsers.join() : '',
            default_browser: rowData.config ? rowData.config.default_browser : '',
          };
          setBusy(true);
          const result = await updateTestRequest(data);

          setRefereshData(true);
        } catch (e) {
          MySwal.fire('Error', e, 'error');
        }
      }
    });
  };

  const deleteMultiRow = async (selectedRows) => {
    MySwal.fire({
      title: 'Are you sure?',
      text: 'Do You Want To Remove All Selected Tests',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete All !',
      cancelButtonText: 'No, cancel !',
      reverseButtons: true,
    }).then(async (result) => {
      if (result.value) {
        try {
          setBusy(true);
          let dataRows = selectedRows;

          for (let x = 0; x < dataRows.length; x++) {
            await deleteCall({ test_id: dataRows[x]._id, org_id: org._id });
            setRefereshData(true);
          }
          setBusy(false);
          showMessage('success', 'Successfully Remove  Selected Tests');
        } catch (e) {
          setBusy(false);
          showMessage('error', e);
          MySwal.fire('Success', 'Successfully Remove All Selected Tests', 'success');
        }
      }
    });
  };

  const handlePopoverOpen = (event, rowData) => {
    setMoreOptionsByRowData(rowData);
    setAnchorEl(event.currentTarget);
    setTimeout(() => {
      setOpenAnchorEl(true);
    }, 10);
  };

  const showLabel = (row) => {
    setTimeout(() => {
      setSelectedRows([row]);
      setLabels(true);
    }, 100);
  };

  const setMoreOptionsByRowData = (row) => {
    const tempData = [];
    tempData.push(
      <Tooltip title={'Delete'}>
        <IconButton
          size="small"
          onClick={() => {
            handlePopoverClose();
            deleteMultiRow([row]);
          }}
          disabled={busy}>
          <DeleteOutlined className={classes.deleteIcon} size={20} />
        </IconButton>
      </Tooltip>,
    );

    if (row.data_driven) {
      tempData.push(
        <Tooltip title={'download csv file'}>
          <IconButton
            size="small"
            onClick={() => {
              handlePopoverClose();
              exportCSVTest(row._id, row.name);
            }}
            disabled={busy}>
            <SaveAltIcon />
          </IconButton>
        </Tooltip>,
      );
    }
    tempData.push(
      row && (
        <Tooltip title={'Add Label'}>
          <IconButton
            size="small"
            onClick={(e) => {
              showLabel(row);
            }}
            disabled={busy}>
            <LabelIcon />
          </IconButton>
        </Tooltip>
      ),
    );

    tempData.push(
      <Tooltip title={'Duplicate'}>
        <IconButton
          size="small"
          onClick={() => {
            handlePopoverClose();
            duplicateRowClick(row);
          }}
          disabled={busy}>
          <ContentCopy />
        </IconButton>
      </Tooltip>,
    );
    tempData.push(
      <Tooltip title={'Test Editor'}>
        <IconButton
          size="small"
          onClick={() => {
            handlePopoverClose();
            testEditorClick(row, true);
          }}
          disabled={busy}>
          <Edit />
        </IconButton>
      </Tooltip>,
    );

    tempData.push(
      <Tooltip title={'Add To Scenario'}>
        <IconButton
          size="small"
          onClick={() => {
            handlePopoverClose();
            moveFolderRowClick([row]);
          }}
          disabled={busy}>
          <DriveFileMove />
        </IconButton>
      </Tooltip>,
    );

    setMoreOptions(tempData);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
    setOpenAnchorEl(false);
  };

  const testRunApi = (params) => {
    return new Promise((resolve, reject) => {
      let { test_id, browser } = params;
      let data = qs.stringify({
        test_id,
        browser,
        org_id: org._id,
      });
      var config = {
        method: 'post',
        url: '/test/run',
        data: data,
      };

      Axios(config)
        .then((ans) => {
          if (ans.data.status) {
            setRefereshData(true);
            resolve(true);
          } else {
            reject(ans.data.message);
            setRefereshData(true);
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const testRunCall = async (browser) => {
    let row = selectedRows[0];
    let runningIds = localStorage.getItem('runningIds');
    runningIds = runningIds ? JSON.parse(runningIds) : [];
    try {
      if (!runningIds.includes(row._id)) {
        runningIds.push(row._id);

        localStorage.setItem('runningIds', JSON.stringify(runningIds));
        setRefereshData(true);
        let params = {
          test_id: row._id,
          browser,
        };
        await testRunApi(params);
        runningIds = localStorage.getItem('runningIds');

        runningIds = runningIds ? JSON.parse(runningIds) : [];
        localStorage.setItem('runningIds', JSON.stringify(runningIds.filter((e) => e != row._id)));
        setTimeout(() => {
          setRefereshData(true);
        }, 500);
      }
    } catch (e) {
      runningIds = localStorage.getItem('runningIds');

      runningIds = runningIds ? JSON.parse(runningIds) : [];
      localStorage.setItem('runningIds', JSON.stringify(runningIds.filter((e) => e != row._id)));
      setTimeout(() => {
        setRefereshData(true);
      }, 500);
      showMessage('error', e, 'error');
    }
  };

  const testRunSync = (data) => {
    return new Promise((resolve, reject) => {
      var config = {
        method: 'post',
        url: '/test/bulk-run',
        data: data,
        headers: {
          'Content-Type': `multipart/form-data`,
        },
      };

      Axios(config)
        .then((ans) => {
          if (ans.data.status) {
            setBusy(true);
            resolve(true);
            setRefereshData(true);
          } else {
            reject(ans.data.message);
            setBusy(false);
          }
        })
        .catch((e) => {
          setBusy(false);
          reject(e);
        });
    });
  };

  const testRunCallMulti = async (browser, type, instance, attach, fileParams, dataDriven) => {
    try {
      let idsToRun = [];

      for (let x = 0; x < rows.length; x++) {
        idsToRun.push(rows[x]._id);
      }
      let data = new formData();
      data.append('browser', browser);
      data.append('id', idsToRun.join(','));
      data.append('type', 1);
      data.append('instance', instance);
      data.append('file', attach);
      data.append('org_id', org._id);
      data.append('data_driven', dataDriven);
      if (fileParams) {
        data.append('file_params', JSON.stringify(fileParams));
      }
      setBusy(true);
      await testRunSync(data);
      setDialogState((prevState) => ({ ...prevState, refreshData: true }));
      setRefereshData(true);
      setBusy(false);
    } catch (e) {
      showMessage('error', e, 'error');
    }
  };

  const checkTestStatus = () => {
    return new Promise((resolve, reject) => {
      let data = qs.stringify({
        ids: runningIds.join(','),
        org_id: org._id,
      });

      var config = {
        method: 'post',
        url: '/test/test-status',
        data: data,
      };

      Axios(config)
        .then((ans) => {
          if (ans.data.status) {
            let remoteData = ans.data.data;
            let tempRunningIds = [];

            remoteData.map((item) => {
              if (runningIds.includes(item._id) && Boolean(item.is_running)) {
                tempRunningIds.push(item._id);
              }
            });

            if (tempRunningIds.length > 0) {
              setRunningIds(tempRunningIds);
            } else {
              setHaveAnyRunning(false);
              setPollReferesh(false);
              setRunningIds([]);
              setRefereshData(true);
              setDialogState((prevState) => ({ ...prevState, refreshData: true }));
            }
            resolve(true);
          } else {
            reject(false);
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  useEffect(() => {
    localStorage.removeItem('runningIds');
    localStorage.removeItem('asyncIds');
  }, [org]);

  if (dialogState.refreshData) {
    webTestData();
    setDialogState((prevState) => ({ ...prevState, refreshData: false }));
    setSelectedRows([]);
  }

  if (refereshData) {
    webTestData();
    setRefereshData(false);
    setSelectedRows([]);
  }

  setTimeout(() => {
    try {
      if (pollReferesh && runningIds.length > 0) {
        if (pollReferesh) {
          setPollReferesh(false);
        }
        checkTestStatus();
      }
    } catch (error) {
      console.log(error);
    }
  }, 1000);

  const exportCSVTest = (id, name) => {
    try {
      const data = {
        test_id: id,
        org_id: org._id,
      };
      let config = {
        method: 'post',
        url: 'test/export',
        data: qs.stringify(data),
      };
      Axios(config)
        .then((ans) => {
          if (ans.status) {
            setBusy(false);
            csvFileDownload(ans.data, name, 'csv')
          }
        })
        .catch((e) => {
          setBusy(false);
          showMessage('error', e.message);
        });
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const exportCSVTestTemplate = (id, name) => {
    try {
      const data = {
        test_id: id,
        org_id: org._id,
      };
      let config = {
        method: 'post',
        url: 'test/export-template',
        data: qs.stringify(data),
      };
      Axios(config)
        .then((ans) => {
          if (ans.status) {
            setBusy(false);
            csvFileDownload(ans.data, name, 'csv')
          }
        })
        .catch((e) => {
          setBusy(false);
          showMessage('error', e.message);
        });
    } catch (error) {
      showMessage('error', error.message);
    }
  };

  const handleRowSelectionChange = () => {
    let selectedRows = testGridRef.current.api.getSelectedRows();
    setSelectedRows(selectedRows);
  };

  const downloadInJson = async () => {
    try {
      if (selectedRows) {
        var ids = []
        selectedRows.map(({ _id }) => {
          ids.push(_id)
        })
        const data = {
          test_ids: ids.join(),
          org_id: org._id
        }
        let config = {
          method: 'post',
          url: 'test/export-tests',
          data: qs.stringify(data),
        };
        Axios(config).then((response) => {
          if (response?.status) {
            csvFileDownload(response.data, "Web Test", 'json')
            setSelectedRows([])
          }
        }).catch((e) => {
          showMessage('error', e.message);
        })
      }
    }
    catch (e) {
      console.log(e)
      showMessage('error', 'error found');
    }

  }
  return (
    <div style={{ marginLeft: '-3%', width: '105%' }}>
      <PageContainer styheading="" breadcrumbs={breadcrumbs}>
        <Box>
          <h2>Tests List</h2>
        </Box>
        <div>
          <Box height={'10vh'} width="100%" bgcolor="#f4f4f7" position={'fixed'} right="0px" top="-20px" zIndex={3}>
            <Box
              width={'100%'}
              display="flex"
              flexDirection="row"
              justifyContent="end"
              alignItems="center"
              position="absolute"
              right="60px"
              top="160px"
              bottom="0px">
              <Box display={'flex'} justifyContent={'right'} width={'35%'}>
                {permissions.run_test && selectedRows.length > 0 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Run Test'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            testExecute(selectedRows);
                          }}
                          disabled={busy}>
                          <PlayArrow style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
                {permissions.create_schedule && selectedRows.length > 0 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Schedule Test'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            scheduleRowClick(selectedRows);
                          }}
                          disabled={busy}>
                          <EventNote style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
                {permissions.add_test_group && selectedRows.length > 0 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Add To Scenario'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            moveFolderRowClick(selectedRows);
                          }}
                          disabled={busy}>
                          <DriveFileMove style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
                {permissions.delete_test && selectedRows.length > 0 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Delete'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            deleteMultiRow(selectedRows);
                          }}
                          disabled={busy}>
                          <DeleteOutlined className={classes.deleteIcon} size={20} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
                {selectedRows.length > 0 && <Box display={'flex'} marginLeft={2}>
                  <Fade right opposite cascade>
                    <Tooltip title={'export'}>
                      <Fab
                        size="small"
                        color="primary"
                        aria-label="add"
                        onClick={downloadInJson}
                        disabled={busy}>
                        <ImportExportIcon style={{ color: 'white' }} />
                      </Fab>
                    </Tooltip>
                  </Fade>
                </Box>}
                <Box display={'flex'} marginLeft={2}>
                  <Fade right opposite cascade>
                    <Tooltip title={'Import'}>
                      <Fab
                        size="small"
                        color="primary"
                        aria-label="add"
                        onClick={() => { SetshowImportWeb(true) }}
                        disabled={busy}>
                        <BackupIcon style={{ color: 'white' }} />
                      </Fab>
                    </Tooltip>
                  </Fade>
                </Box>
                {selectedRows.length > 0 && <Box display={'flex'} marginLeft={2}>
                  <Fade right opposite cascade>
                    <Tooltip title={'download'}>
                      <Fab
                        size="small"
                        color="primary"
                        aria-label="add"
                        onClick={() => {
                          exportCSVTestTemplate(selectedRows[0]._id, selectedRows[0].name);
                        }}
                        disabled={busy}>
                        <SaveAltIcon style={{ color: 'white' }} />
                      </Fab>
                    </Tooltip>
                  </Fade>
                </Box>}
                {permissions.list_test_history && selectedRows.length === 1 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Test History'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            historyClick(selectedRows);
                          }}
                          disabled={busy}>
                          <History style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
                {selectedRows.length === 1 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Add Label'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={(e) => {
                            setLabels(true);
                          }}
                          disabled={busy}>
                          <LabelIcon style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
                {selectedRows.length === 1 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Duplicate'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            duplicateRowClick(selectedRows[0]);
                          }}
                          disabled={busy}>
                          <ContentCopy style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}

                {selectedRows.length === 1 && (
                  <Box display={'flex'} marginLeft={2}>
                    <Fade right opposite cascade>
                      <Tooltip title={'Test Editor'}>
                        <Fab
                          size="small"
                          color="primary"
                          aria-label="add"
                          onClick={() => {
                            testEditorClick(selectedRows[0], true);
                          }}
                          disabled={busy}>
                          <Edit style={{ color: 'white' }} />
                        </Fab>
                      </Tooltip>
                    </Fade>
                  </Box>
                )}
              </Box>
              {permissions.create_test && (
                <Box display={'flex'} marginLeft={2}>
                  <Tooltip title={'Create New Test'}>
                    <Fab
                      size="small"
                      color="primary"
                      aria-label="add"
                      onClick={() => {
                        testEditorClick(null, false);
                      }}
                      disabled={busy}>
                      <AddIcon style={{ color: 'white' }} />
                    </Fab>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </Box>
        </div>
        <br />
        <Box width="100%" mb="2vh">
          <Autocomplete
            size="small"
            multiple
            id="checkboxes-tags-demo"
            options={userFilter}
            sx={{ fontWeight: 400, fontSize: '0.875rem', letterSpacing: '0.01071em' }}
            onChange={(event, newValue) => {
              var ids = [];

              Array.isArray(newValue) && newValue.map(({ _id }) => ids.push(_id));
              setFilters({ ...filters, f_user: ids });
              setTimeout(() => {
                setRefereshData(true);
              }, 300);
            }}
            disableCloseOnSelect
            getOptionLabel={(option) => option.title}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox icon={icon} checkedIcon={checkedIcon} style={{ marginRight: 8 }} checked={selected} />
                {option.title}
              </li>
            )}
            style={{ width: '47%' }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                variant="outlined"
                label="Filter By User Name"
                placeholder="Select User "
              />
            )}
          />
        </Box>
        <Box width="100%" display="flex" alignItems="center" alignContent="center" justifyContent="flex-start">
          <Box width="15%">
            <TextField
              style={{ width: '100%', fontWeight: 400, fontSize: '0.875rem', letterSpacing: '0.01071em' }}
              type="text"
              size="small"
              label="Filter By Name"
              name="f_name"
              value={filters.f_name}
              variant="outlined"
              onChange={(e) => {
                getFilterValue(e);
              }}
            />
          </Box>
          <Box width="15%" mr="1%" ml="1%">
            <DatePicker
              disableToolbar
              style={{ width: '100%', fontWeight: 400, fontSize: '0.875rem', letterSpacing: '0.01071em' }}
              format="DD/MM/YYYY"
              inputVariant="outlined"
              label="Start Date"
              variant="outlined"
              size="small"
              value={web_filter.start}
              onChange={(e) => {
                dispatch(webDateFilter({ ...web_filter, 'start': e._d }))
                setTimeout(() => {
                  setRefereshData(true);
                }, 300);
              }}
            />
          </Box>
          <Box width="15%">
            <DatePicker
              disableToolbar
              format="DD/MM/YYYY"
              size="small"
              style={{ width: '100%', fontWeight: 400, fontSize: '0.875rem', letterSpacing: '0.01071em' }}
              inputVariant="outlined"
              label="End Date"
              variant="outlined"
              value={web_filter.end}
              onChange={(e) => {
                dispatch(webDateFilter({ ...web_filter, 'end': e._d }))
                setTimeout(() => {
                  setRefereshData(true);
                }, 300);
              }}
            />
          </Box>
        </Box>
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" style={{ margin: '10px' }}>
          <Box>
            <Input
              id="input-with-icon-adornment"
              placeholder="Search"
              inputRef={searchInputRef}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setTimeout(() => {
                  setRefereshData(true);
                }, 300);
              }}
              startAdornment={
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              }
              endAdornment={
                <InputAdornment position="end">
                  <CloseIcon
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      searchInputRef.current.value = '';
                      setFilters({ ...filters, search: '' });
                      setTimeout(() => {
                        setRefereshData(true);
                      }, 300);
                    }}
                  />
                </InputAdornment>
              }
            />
            <Button
              aria-controls={openExportDialog ? 'demo-positioned-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={openExportDialog ? 'true' : undefined}
              onClick={(e) => {
                setAnchorElExport(e.currentTarget);
              }}>
              <ExportIcon />
            </Button>
            <Menu
              id="demo-positioned-menu"
              aria-labelledby="demo-positioned-button"
              anchorEl={anchorElExport}
              open={openExportDialog}
              onClose={handleExportMenuClose}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}>
              <MenuItem2 onClick={handleExportTableToCsv}>Export CSV</MenuItem2>
              <MenuItem2 onClick={handleExportTableToExcel}>Export Excel</MenuItem2>
            </Menu>
          </Box>
        </Box>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact
            ref={testGridRef}
            columnDefs={columnDefs}
            animateRows={true}
            rowSelection="multiple"
            rowModelType={'serverSide'}
            serverSideStoreType={'partial'}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={pageSize}
            cacheBlockSize={pageSize}
            statusBar={statusBar}
            onGridReady={onGridReady}
            onSelectionChanged={handleRowSelectionChange}
          />
        </div>
        <Popover
          open={openAnchorEl}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}>
          <Paper elevation={8}>
            <MenuList>
              <Box display="flex" style={{ padding: '7px 10px' }}>
                {moreOptions}
              </Box>
            </MenuList>
          </Paper>
        </Popover>

        {showCreateDial && <AddNew hideDialog={setShowCreateDial} setRefereshData={setRefereshData} />}
        {showDuplicate && (
          <Duplicate hideDialog={setShowDuplicate} setRefereshData={setRefereshData} rowData={rowData} />
        )}
        {showBrowserSelect && <BrowserSelect showDialog={setShowBrowserSelect} testRunCall={testRunCall} />}
        {showMultiRun && (
          <MultiRun
            showDialog={setShowMultiRun}
            testRunCall={testRunCallMulti}
            setOpenRunDialog={setShowMultiRun}
            exportCSVTestTemplate={exportCSVTestTemplate}
            data={rows}
          />
        )}
        {showSchedule && (
          <Schedule
            hideDialog={setShowSchedule}
            showSchedule={showSchedule}
            rowData={rowData}
            setSelection={setSelectedRows}
          />
        )}

        {showMove && <MoveToFolder hideDialog={setShowMove} setRefereshData={setRefereshData} selectedRows={rows} />}
        {labels && (
          <LabelComponent
            close={setLabels}
            rowData={selectedRows}
            setRefereshData={setRefereshData}
            setSelectedRows={setSelectedRows}
            handlePopoverClose={handlePopoverClose}
            type="test"
          />
        )}
        {showImportWeb && <ImportWeb hideDialog={SetshowImportWeb} setRefereshData={setRefereshData} org={org._id} />}

      </PageContainer>
    </div>
  );
};

export default withStyles({}, { withTheme: true })(ListAll);
