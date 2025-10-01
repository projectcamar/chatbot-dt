// Shared storage untuk sync data antar functions
let masterData = {
    content: '',
    lastUpdated: null,
    updatedBy: ''
};

function getMasterData() {
    return masterData;
}

function setMasterData(data) {
    masterData = data;
    console.log('Master data updated in shared storage:', masterData);
}

module.exports = {
    getMasterData,
    setMasterData
};
