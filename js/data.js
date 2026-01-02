// data.js — localStorage-backed fake backend for ORDIN v1 demo

const ORDIN = (() => {
  const KEY = "ordin_v1_db";

  const seed = () => ({
    session: null, // { userId, role }
    users: [
      // Seed admin
      { id:"u_admin", email:"admin@ordin.uk", pass:"admin", role:"ADMIN", name:"Admin" }
    ],
    orgs: [],
    orgUsers: [],
    contractors: [],
    invites: [],
    engagements: [],
    taskDefs: [
      // Contractor tasks (core v1)
      { id:"td_personal", code:"CONTRACTOR_PERSONAL_DETAILS", title:"Provide personal details", owner:"CONTRACTOR", applies:"ALL", order:10, required:true },
      { id:"td_type", code:"CONTRACTOR_TYPE_CONFIRM", title:"Confirm contractor type", owner:"CONTRACTOR", applies:"ALL", order:20, required:true },
      { id:"td_address", code:"CONTRACTOR_UK_ADDRESS", title:"Confirm UK address", owner:"CONTRACTOR", applies:"ALL", order:30, required:true },
      { id:"td_docs", code:"CONTRACTOR_UPLOAD_DOCS", title:"Upload required documents", owner:"CONTRACTOR", applies:"ALL", order:40, required:true },
      { id:"td_review", code:"CONTRACTOR_REVIEW_CONTRACT", title:"Review contract", owner:"CONTRACTOR", applies:"ALL", order:50, required:true },
      { id:"td_sign", code:"CONTRACTOR_SIGN_CONTRACT", title:"Sign contract", owner:"CONTRACTOR", applies:"ALL", order:60, required:true },
      { id:"td_decl", code:"CONTRACTOR_DECLARATIONS", title:"Complete declarations", owner:"CONTRACTOR", applies:"ALL", order:70, required:true },

      // Employer tasks (simple v1)
      { id:"td_org", code:"EMPLOYER_COMPLETE_ORG", title:"Complete organisation profile", owner:"EMPLOYER", applies:"ALL", order:10, required:true },
      { id:"td_send", code:"EMPLOYER_SEND_CONTRACT", title:"Send contract", owner:"EMPLOYER", applies:"ALL", order:20, required:true }
    ],
    taskDeps: [
      // sequential (contractor)
      ["td_type","td_personal"],
      ["td_address","td_type"],
      ["td_docs","td_address"],
      ["td_review","td_docs"],
      ["td_sign","td_review"],
      ["td_decl","td_sign"],
      // employer
      ["td_send","td_org"]
    ],
    tasks: [], // {id, engagementId, taskDefId, status, completedAt}
    contracts: [], // {id, engagementId, status, sentAt, signedAt}
    documents: [], // {id, engagementId, type, name, createdAt}
    audit: []
  });

  const load = () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw);
  };

  const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));

  const uid = (p="id") => `${p}_${Math.random().toString(16).slice(2)}_${Date.now()}`;

  const log = (db, eventType, data) => {
    db.audit.push({ id: uid("ae"), at: new Date().toISOString(), eventType, data });
  };

  const getSession = () => load().session;

  const login = (email, pass) => {
    const db = load();
    const u = db.users.find(x => x.email.toLowerCase() === email.toLowerCase() && x.pass === pass);
    if (!u) return { ok:false, error:"Invalid email or password" };
    db.session = { userId: u.id, role: u.role };
    log(db, "LOGIN", { userId: u.id });
    save(db);
    return { ok:true, user:u };
  };

  const logout = () => {
    const db = load();
    db.session = null;
    save(db);
  };

  const requireRole = (roles) => {
    const db = load();
    const s = db.session;
    if (!s || !roles.includes(s.role)) return null;
    return s;
  };

  // Employer signup: creates org + employer user + org membership, and logs in.
  const employerSignup = ({ companyName, email, pass, contactName }) => {
    const db = load();
    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok:false, error:"Email already exists" };
    }
    const userId = uid("u");
    db.users.push({ id:userId, email, pass, role:"EMPLOYER", name: contactName || "Employer" });

    const orgId = uid("org");
    db.orgs.push({
      id: orgId,
      name: companyName,
      company_type: "LTD",
      registration_number: "",
      registered_address_line1: "",
      registered_address_line2: "",
      city: "",
      postcode: "",
      country:"UK",
      primary_contact_name: contactName || "",
      primary_contact_email: email
    });

    db.orgUsers.push({ id: uid("ou"), organisationId: orgId, userId, orgRole:"ORG_ADMIN" });

    db.session = { userId, role:"EMPLOYER" };
    log(db, "EMPLOYER_SIGNUP", { userId, orgId });
    save(db);
    return { ok:true, orgId, userId };
  };

  const getEmployerOrg = (db, userId) => {
    const m = db.orgUsers.find(x => x.userId === userId);
    if (!m) return null;
    return db.orgs.find(o => o.id === m.organisationId) || null;
  };

  const inviteContractor = ({ employerUserId, contractorEmail }) => {
    const db = load();
    const org = getEmployerOrg(db, employerUserId);
    if (!org) return { ok:false, error:"No organisation found" };

    const token = uid("invite"); // demo token; store as plain for prototype
    const invId = uid("inv");
    db.invites.push({
      id: invId,
      organisationId: org.id,
      email: contractorEmail,
      token,
      status:"PENDING",
      expiresAt: new Date(Date.now() + 7*24*3600*1000).toISOString(),
      createdBy: employerUserId
    });
    log(db, "INVITE_CREATED", { invId, orgId: org.id, email: contractorEmail });
    save(db);
    return { ok:true, token };
  };

  // Contractor accept invite: creates contractor user+profile, engagement, tasks, contract stub
  const contractorAccept = ({ token, contractorType, firstName, lastName, email, pass }) => {
    const db = load();
    const inv = db.invites.find(i => i.token === token && i.status === "PENDING");
    if (!inv) return { ok:false, error:"Invalid or expired invite token" };

    if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok:false, error:"Email already exists" };
    }

    inv.status = "ACCEPTED";
    inv.acceptedAt = new Date().toISOString();

    const userId = uid("u");
    db.users.push({ id:userId, email, pass, role:"CONTRACTOR", name:`${firstName} ${lastName}` });

    const contractorId = uid("ctr");
    db.contractors.push({
      id: contractorId,
      userId,
      contractor_type: contractorType,
      first_name: firstName,
      last_name: lastName,
      phone:"",
      address_line1:"",
      address_line2:"",
      city:"",
      postcode:"",
      country:"UK",
      status:"ACTIVE"
    });

    const engagementId = uid("eng");
    db.engagements.push({
      id: engagementId,
      organisationId: inv.organisationId,
      contractorId,
      status:"ONBOARDING",
      readiness:"NOT_READY"
    });

    // Create task instances for the engagement
    const defs = db.taskDefs
      .filter(d => d.owner === "CONTRACTOR" || d.owner === "EMPLOYER")
      .filter(d => d.applies === "ALL" || d.applies === contractorType)
      .sort((a,b)=>a.order-b.order);

    defs.forEach(def => {
      db.tasks.push({
        id: uid("t"),
        engagementId,
        taskDefId: def.id,
        status:"LOCKED",
        completedAt:null,
        completedBy:null
      });
    });

    // Unlock first contractor task + first employer task
    const firstContractor = defs.find(d=>d.owner==="CONTRACTOR");
    const firstEmployer = defs.find(d=>d.owner==="EMPLOYER");
    if (firstContractor) {
      const t = db.tasks.find(x=>x.engagementId===engagementId && x.taskDefId===firstContractor.id);
      if (t) t.status="AVAILABLE";
    }
    if (firstEmployer) {
      const t = db.tasks.find(x=>x.engagementId===engagementId && x.taskDefId===firstEmployer.id);
      if (t) t.status="AVAILABLE";
    }

    // Create a contract stub (v1)
    db.contracts.push({
      id: uid("c"),
      engagementId,
      status:"DRAFT",
      sentAt:null,
      signedAt:null
    });

    db.session = { userId, role:"CONTRACTOR" };
    log(db, "CONTRACTOR_ACCEPTED_INVITE", { userId, contractorId, engagementId, orgId: inv.organisationId });
    save(db);
    return { ok:true, engagementId };
  };

  const getMyContext = () => {
    const db = load();
    const s = db.session;
    if (!s) return { ok:false };

    const user = db.users.find(u=>u.id===s.userId);
    if (!user) return { ok:false };

    if (s.role === "EMPLOYER") {
      const org = getEmployerOrg(db, s.userId);
      return { ok:true, db, user, org };
    }

    if (s.role === "CONTRACTOR") {
      const ctr = db.contractors.find(c=>c.userId===s.userId);
      const eng = ctr ? db.engagements.find(e=>e.contractorId===ctr.id) : null;
      const org = eng ? db.orgs.find(o=>o.id===eng.organisationId) : null;
      return { ok:true, db, user, contractor: ctr, engagement: eng, org };
    }

    return { ok:true, db, user };
  };

  const completeTask = ({ engagementId, taskDefCode, actorUserId }) => {
    const db = load();
    const def = db.taskDefs.find(d=>d.code===taskDefCode);
    if (!def) return { ok:false, error:"Unknown task" };
    const task = db.tasks.find(t=>t.engagementId===engagementId && t.taskDefId===def.id);
    if (!task) return { ok:false, error:"Task not found" };
    if (task.status !== "AVAILABLE") return { ok:false, error:"Task not available" };

    task.status = "COMPLETED";
    task.completedAt = new Date().toISOString();
    task.completedBy = actorUserId;
    log(db, "TASK_COMPLETED", { engagementId, code: taskDefCode, actorUserId });

    // Unlock next tasks whose dependencies are satisfied
    unlockTasks(db, engagementId);

    // Update readiness
    updateReadiness(db, engagementId);

    save(db);
    return { ok:true };
  };

  const unlockTasks = (db, engagementId) => {
    const tasks = db.tasks.filter(t=>t.engagementId===engagementId);
    const byDefId = new Map(tasks.map(t=>[t.taskDefId, t]));

    for (const t of tasks) {
      if (t.status !== "LOCKED") continue;

      const def = db.taskDefs.find(d=>d.id===t.taskDefId);
      const deps = db.taskDeps.filter(d => d[0] === def.id).map(d => d[1]); // depends on
      const allDone = deps.every(depId => {
        const depTask = byDefId.get(depId);
        return depTask && depTask.status === "COMPLETED";
      });
      if (allDone) t.status = "AVAILABLE";
    }
  };

  const updateReadiness = (db, engagementId) => {
    const eng = db.engagements.find(e=>e.id===engagementId);
    if (!eng) return;

    const reqDefs = db.taskDefs.filter(d=>d.required);
    const tasks = db.tasks.filter(t=>t.engagementId===engagementId);
    const done = (defId) => tasks.find(x=>x.taskDefId===defId)?.status === "COMPLETED";

    // readiness: all required contractor tasks + employer tasks + contract signed
    const requiredOk = reqDefs.every(d => {
      // Only count tasks that exist for engagement
      const t = tasks.find(x=>x.taskDefId===d.id);
      return t ? t.status==="COMPLETED" : true;
    });

    const contract = db.contracts.find(c=>c.engagementId===engagementId);
    const contractSigned = contract && contract.status === "SIGNED";

    if (!requiredOk) {
      eng.readiness = tasks.some(t=>t.status==="COMPLETED") ? "IN_PROGRESS" : "NOT_READY";
      eng.status = "ONBOARDING";
      return;
    }

    if (requiredOk && contractSigned) {
      eng.readiness = "READY";
      eng.status = "READY";
    } else {
      eng.readiness = "IN_PROGRESS";
      eng.status = "ONBOARDING";
    }
  };

  const sendContract = ({ engagementId }) => {
    const db = load();
    const c = db.contracts.find(x=>x.engagementId===engagementId);
    if (!c) return { ok:false, error:"No contract" };
    c.status = "SENT";
    c.sentAt = new Date().toISOString();
    log(db, "CONTRACT_SENT", { engagementId });
    save(db);
    return { ok:true };
  };

  const signContract = ({ engagementId, actorUserId }) => {
    const db = load();
    const c = db.contracts.find(x=>x.engagementId===engagementId);
    if (!c) return { ok:false, error:"No contract" };
    c.status = "SIGNED";
    c.signedAt = new Date().toISOString();
    log(db, "CONTRACT_SIGNED", { engagementId, actorUserId });
    updateReadiness(db, engagementId);
    save(db);
    return { ok:true };
  };

  const addDocument = ({ engagementId, type, name }) => {
    const db = load();
    db.documents.push({ id: uid("doc"), engagementId, type, name, createdAt: new Date().toISOString() });
    log(db, "DOCUMENT_UPLOADED", { engagementId, type, name });
    save(db);
    return { ok:true };
  };

  const resetDemo = () => {
    localStorage.removeItem(KEY);
    load();
  };

  return {
    load, save, uid, log,
    getSession, login, logout, requireRole,
    employerSignup, inviteContractor, contractorAccept,
    getMyContext,
    completeTask, sendContract, signContract, addDocument,
    resetDemo
  };
})();
