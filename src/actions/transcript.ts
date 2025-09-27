import { GiveawaysManager } from '../GiveawaysManager';

/**
 * Extended Participant type for transcript generation
 */
interface ExtendedParticipant {
  userId: string;
  username?: string;
  avatar?: string;
  joinedAt?: number;
  bonusEntries?: number;
}

/**
 * Options for generating a transcript
 */
interface TranscriptOptions {
  outputDir?: string;
  includeStats?: boolean;
  theme?: 'dark' | 'light';
}

/**
 * Generate an HTML transcript for a giveaway
 */
export async function generateTranscript(manager: GiveawaysManager, giveawayId: string, options: TranscriptOptions = {}): Promise<string> {
  try {
    const giveaway = manager.giveaways.find(g => g.data.messageId === giveawayId);
    if (!giveaway) {
      throw new Error(`Giveaway with messageId ${giveawayId} not found`);
    }

    const participants: ExtendedParticipant[] = (giveaway.data.participants || []).map(p => ({
      userId: (p as any).id ?? 'unknown',
      username: (p as any).username,
      globalName: (p as any).globalName,
      avatar: (p as any).avatar,
      joinedAt: (p as any).joinedAt,
      bonusEntries: (p as any).bonusEntries ?? 0,
    }));

    // Sort participants by join time (newest first)
    participants.sort((a, b) => (b.joinedAt || 0) - (a.joinedAt || 0));

    const winners = giveaway.data.winnerIds || [];
    const { includeStats = true } = options;

    const escapeHtml = (str: string = '') => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

    const formatDate = (timestamp?: number) => {
      if (!timestamp) return 'Unknown';
      return new Date(timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    const formatTimeAgo = (timestamp?: number) => {
      if (!timestamp) return '';
      const now = Date.now();
      const diff = now - timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (minutes > 0) return `${minutes}m ago`;
      return 'Just now';
    };

    const prize = escapeHtml(giveaway.data.prize || 'Unknown Prize');
    const hostId = escapeHtml(giveaway.data.hostId || 'Unknown');
    const startAt = formatDate(giveaway.data.startAt);
    const endAt = formatDate(giveaway.data.endAt);
    const status = giveaway.data.ended ? 'Ended' : giveaway.data.paused ? 'Paused' : 'Active';
    const duration = giveaway.data.startAt && giveaway.data.endAt ? Math.round((giveaway.data.endAt - giveaway.data.startAt) / 60000) + ' minutes' : 'Unknown';

    // Statistics
    const totalBonusEntries = participants.reduce((sum, p) => sum + (p.bonusEntries || 0), 0);
    const participantsWithBonus = participants.filter(p => (p.bonusEntries || 0) > 0).length;

    const winnersHtml = winners.length
      ? winners
          .map((w, index) => {
            const winner = participants.find(p => p.userId === w);
            if (!winner) return '';

            return `
              <div class="winner-card" data-winner="${index + 1}">
                <div class="winner-rank">#${index + 1}</div>
                <img src="${winner.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
                     alt="${escapeHtml(winner.username || 'Unknown')}"
                     class="winner-avatar"/>
                <div class="winner-info">
                  <div class="winner-name">${escapeHtml(winner.username || 'Unknown User')}</div>
                  <div class="winner-id">ID: ${winner.userId}</div>
                  ${winner.bonusEntries ? `<div class="winner-bonus">+${winner.bonusEntries} bonus entries</div>` : ''}
                  ${winner.joinedAt ? `<div class="winner-joined">Joined ${formatTimeAgo(winner.joinedAt)}</div>` : ''}
                </div>
                <div class="winner-badge">👑 WINNER</div>
              </div>
            `;
          })
          .join('')
      : '<div class="no-winners">🎯 No winners selected yet</div>';

    const participantsHtml = participants.length
      ? participants
          .map((p, index) => {
            const isWinner = winners.includes(p.userId);
            return `
              <li class="participant-item ${isWinner ? 'is-winner' : ''}" data-index="${index + 1}">
                <div class="participant-rank">${index + 1}</div>
                <img src="${p.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" 
                     alt="${escapeHtml(p.username || p.userId)}"
                     class="participant-avatar"/>
                <div class="participant-info">
                  <span class="participant-name">${escapeHtml(p.username || p.userId)}</span>
                  ${p.joinedAt ? `<span class="participant-time">${formatTimeAgo(p.joinedAt)}</span>` : ''}
                </div>
                ${p.bonusEntries ? `<span class="bonus-badge">+${p.bonusEntries}</span>` : ''}
                ${isWinner ? '<span class="winner-indicator">👑</span>' : ''}
              </li>
            `;
          })
          .join('')
      : '<li class="no-participants">No participants yet</li>';

    const statsHtml = includeStats
      ? `
        <div class="card stats-card">
          <h2>Statistics</h2>
          <div class="stats-grid">
            <div class="stat-item"><div class="stat-value">${participants.length}</div><div class="stat-label">Total Participants</div></div>
            <div class="stat-item"><div class="stat-value">${winners.length}</div><div class="stat-label">Winners Selected</div></div>
            <div class="stat-item"><div class="stat-value">${totalBonusEntries}</div><div class="stat-label">Bonus Entries</div></div>
            <div class="stat-item"><div class="stat-value">${participantsWithBonus}</div><div class="stat-label">Users with Bonus</div></div>
            <div class="stat-item"><div class="stat-value">${duration}</div><div class="stat-label">Duration</div></div>
            <div class="stat-item"><div class="stat-value">${winners.length}/${giveaway.data.winnerCount}</div><div class="stat-label">Win Rate</div></div>
          </div>
        </div>
      `
      : '';

    const html = generateHTMLTemplate({
      prize,
      hostId,
      startAt,
      endAt,
      status,
      duration,
      winners,
      giveaway,
      participants,
      winnersHtml,
      participantsHtml,
      statsHtml,
      giveawayId,
      includeStats,
    });

    return html;
  } catch (error) {
    console.error('❌ Error generating transcript:', error);
    throw error;
  }
}

/**
 * Generate HTML template for the transcript
 */
function generateHTMLTemplate(data: { prize: string; hostId: string; startAt: string; endAt: string; status: string; duration: string; winners: string[]; giveaway: any; participants: ExtendedParticipant[]; winnersHtml: string; participantsHtml: string; statsHtml: string; giveawayId: string; includeStats: boolean }): string {
  const { prize, hostId, startAt, endAt, status, winners, giveaway, winnersHtml, participantsHtml, statsHtml, giveawayId, participants } = data;

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="icon" type="image/png" href="https://g.top4top.io/p_35557yeku1.png">
  <title>🎁 Giveaway Transcript - ${prize}</title>
  <style>
    ${generateStyles()}
  </style>
</head>
<body>
  <div class="container">
    <header class="header fade-in">
      <h1>🎁 Giveaway Transcript</h1>
      <p class="subtitle">Complete analysis and results for "${prize}"</p>
    </header>
    
    <div class="grid">
      <div class="left-column">
        <div class="card fade-in">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21A7,7 0 0,1 14,26H10A7,7 0 0,1 3,19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M12,4A0,0 0 0,0 12,4A0,0 0 0,0 12,4M14,9H10A5,5 0 0,0 5,14V17H19V14A5,5 0 0,0 14,9Z"/>
            </svg>
            Giveaway Details
          </h2>
          <div class="details-grid">
            <div class="detail-row">
              <span class="detail-label">🎁 Prize</span>
              <span class="detail-value">${prize}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">👑 Host</span>
              <span class="detail-value">${hostId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🚀 Started</span>
              <span class="detail-value">${startAt}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🏁 Ended</span>
              <span class="detail-value">${endAt}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📊 Status</span>
              <span class="detail-value"><span class="status ${status.toLowerCase()}">${status}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">🏆 Winners</span>
              <span class="detail-value">${winners.length} / ${giveaway.data.winnerCount}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">👥 Participants</span>
              <span class="detail-value">${participants.length}</span>
            </div>
          </div>
        </div>
        
        ${statsHtml}
        
        <div class="card fade-in winners-section">
          <h2>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Winners ${winners.length ? `(${winners.length})` : ''}
          </h2>
          <div class="winners-container">
            ${winnersHtml}
          </div>
        </div>
      </div>
      
      <div class="right-column">
        <div class="card fade-in participants-section">
          <div class="participants-header">
            <h2>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4C18.2 4 20 5.8 20 8S18.2 12 16 12 12 10.2 12 8 13.8 4 16 4M16 14C20.4 14 24 15.8 24 18V20H8V18C8 15.8 11.6 14 16 14M8 4C10.2 4 12 5.8 12 8S10.2 12 8 12 4 10.2 4 8 5.8 4 8 4M8 14C12.4 14 16 15.8 16 18V20H0V18C0 15.8 3.6 14 8 14Z"/>
              </svg>
              Participants 
            </h2>
            <input type="text" class="search-box" placeholder="Search participants..." 
                   onkeyup="searchParticipants(this.value)"/>
          </div>
          <div class="participants-container">
            <ul class="participants-list" id="participantsList">
              ${participantsHtml}
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    ${generateScript()}
  </script>
</body>
</html>
  `;
}

/**
 * Generate CSS styles for the transcript
 */
function generateStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #1e1d1e;
      color: #ffffff;
      line-height: 1.6;
      padding: 20px;
      min-height: 100vh;
    }
    
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding: 40px;
      background: rgba(54, 153, 195, 0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(54, 153, 195, 0.2);
      border-radius: 24px;
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, 
        rgba(54, 153, 195, 0.1), 
        rgba(41, 128, 185, 0.1),
        rgba(54, 153, 195, 0.05)
      );
      border-radius: inherit;
      pointer-events: none;
    }
    
    .header::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, 
        rgba(54, 153, 195, 0.1) 0%, 
        transparent 50%
      );
      animation: headerGlow 6s ease-in-out infinite alternate;
      pointer-events: none;
    }
    
    @keyframes headerGlow {
      0% { transform: rotate(0deg) scale(1); opacity: 0.5; }
      100% { transform: rotate(180deg) scale(1.1); opacity: 0.8; }
    }
    
    .header h1 {
      font-size: clamp(1.8rem, 4vw, 2.5rem);
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    }
    
    .header .subtitle {
      opacity: 0.9;
      font-size: 1.1rem;
      font-weight: 300;
    }
    
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 25px;
    }
    
    @media (min-width: 1024px) {
      .grid {
        grid-template-columns: 2fr 1fr;
      }
    }
    
    .card {
      background: #1e1d1e;
      border-radius: 16px;
      padding: 25px;
      margin-bottom: 1rem;
      box-shadow: 0 8px 20px rgba(0,0,0,0.4);
      border: 1px solid #333;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .card:hover {
      box-shadow: 0 12px 30px rgba(0,0,0,0.5);
      transform: translateY(-2px);
    }
    
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
      background: linear-gradient(to bottom, #3699c3, #2980b9);
      border-radius: 0 2px 2px 0;
    }
    
    .card h2 {
      margin: 0 0 20px 8px;
      font-size: 1.4rem;
      color: #3699c3;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .card h2 svg {
      width: 24px;
      height: 24px;
      opacity: 0.8;
    }
    
    /* Details Section */
    .details-grid {
      display: grid;
      gap: 15px;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 8px;
      border-radius: 8px;
      background: rgba(54, 153, 195, 0.05);
      border-left: 3px solid #3699c3;
      transition: all 0.2s ease;
    }
    
    .detail-row:hover {
      background: rgba(54, 153, 195, 0.1);
    }
    
    .detail-label {
      font-weight: 600;
      color: #3699c3;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .detail-value {
      color: #ffffff;
      font-weight: 500;
      text-align: right;
    }
    
    .status {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status.active { background: #27ae60; color: white; }
    .status.ended { background: #e74c3c; color: white; }
    .status.paused { background: #f39c12; color: white; }
    
    /* Winners Section */
    .winners-container {
      max-height: 600px;
      overflow-y: auto;
      padding-right: 5px;
    }
    
    .winner-card {
      display: flex;
      align-items: center;
      gap: 15px;
      background: #1e1d1e;
      padding: 18px;
      border-radius: 12px;
      margin-bottom: 15px;
      border-left: 4px solid #3699c3;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .winner-card::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(45deg, transparent, rgba(54, 153, 195, 0.1));
      pointer-events: none;
    }
    
    .winner-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(54, 153, 195, 0.2);
    }
    
    .winner-rank {
      background: #3699c3;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
    }
    
    .winner-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 3px solid #3699c3;
      transition: all 0.3s ease;
    }
    
    .winner-card:hover .winner-avatar {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(54, 153, 195, 0.4);
    }
    
    .winner-info {
      flex: 1;
    }
    
    .winner-name {
      font-weight: 600;
      color: #ffffff;
      font-size: 1.1rem;
      margin-bottom: 4px;
    }
    
    .winner-id {
      font-size: 0.8rem;
      color: #3699c3;
      opacity: 0.8;
      margin-bottom: 2px;
    }
    
    .winner-bonus, .winner-joined {
      font-size: 0.75rem;
      color: #3699c3;
      opacity: 0.9;
    }
    
    .winner-badge {
      background: #3699c3;
      color: white;
      padding: 8px 16px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 8px rgba(54, 153, 195, 0.3);
    }
    
    .winner-badge svg {
      width: 16px;
      height: 16px;
    }
    
    .no-winners {
      text-align: center;
      padding: 40px;
      color: #888;
      font-style: italic;
      font-size: 1.1rem;
    }
    
    /* Participants Section */
    .participants-header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
      width: 100%;
    }
    
    .search-box {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #444;
      background: #222;
      color: #fff;
      box-sizing: border-box;
    }
    
    .participants-list {
      margin-top: 1rem;
    }
    
    .search-box:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(54, 153, 195, 0.3);
      background: #333;
    }
    
    .participants-container {
      max-height: 70vh;
      overflow-y: auto;
      border-radius: 8px;
    }
    
    .participants-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .participant-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      background: #2a2a2a;
      transition: all 0.2s ease;
      position: relative;
    }
    
    .participant-item:hover {
      background: #333;
      transform: translateX(5px);
    }
    
    .participant-item.is-winner {
      background: linear-gradient(90deg, #2a2a2a, rgba(54, 153, 195, 0.1));
      border-left: 3px solid #3699c3;
    }
    
    .participant-rank {
      color: #3699c3;
      font-weight: 600;
      font-size: 0.8rem;
      min-width: 30px;
      text-align: center;
    }
    
    .participant-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid #3699c3;
      transition: all 0.3s ease;
    }
    
    .participant-item:hover .participant-avatar {
      transform: scale(1.1);
    }
    
    .participant-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    
    .participant-name {
      color: #ffffff;
      font-weight: 500;
      font-size: 0.95rem;
    }
    
    .participant-time {
      color: #888;
      font-size: 0.75rem;
      margin-top: 2px;
    }
    
    .bonus-badge {
      background: #3699c3;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    
    .winner-indicator {
      font-size: 1.2rem;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .no-participants {
      text-align: center;
      padding: 40px;
      color: #888;
      font-style: italic;
    }
    
    /* Statistics */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
    }
    
    .stat-item {
      text-align: center;
      padding: 20px;
      background: rgba(54, 153, 195, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(54, 153, 195, 0.2);
      transition: all 0.3s ease;
    }
    
    .stat-item:hover {
      background: rgba(54, 153, 195, 0.15);
      transform: translateY(-2px);
    }
    
    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: #3699c3;
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #ccc;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #2a2a2a;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #3699c3;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #2980b9;
    }
    
    /* Responsive Design */
    @media (max-width: 768px) {
      body { padding: 15px; }
      .card { padding: 20px; }
      .winner-card { padding: 15px; flex-wrap: wrap; }
      .winner-badge { margin-top: 10px; }
      .search-box { width: 150px; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .header { padding: 20px; }
    }
    
    @media (max-width: 480px) {
      .card h2 { font-size: 1.2rem; }
      .detail-row { flex-direction: column; align-items: flex-start; gap: 5px; }
      .detail-value { text-align: left; }
      .stats-grid { grid-template-columns: 1fr; }
    }
    
    /* Print Styles */
    @media print {
      body { background: white; color: black; }
      .card { box-shadow: none; border: 1px solid #ddd; }
      .winner-card { break-inside: avoid; }
      .participants-container { max-height: none; }
    }
    
    /* Accessibility */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
    
    /* Loading States */
    .loading {
      opacity: 0.6;
      pointer-events: none;
    }
    
    /* Animations */
    .fade-in {
      animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
}

/**
 * Generate JavaScript functionality for the transcript
 */
function generateScript(): string {
  return `
    // Add fade-in animation to elements as they load
    document.addEventListener('DOMContentLoaded', function() {
      const elements = document.querySelectorAll('.fade-in');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.style.animation = \`fadeIn 0.5s ease-in-out \${index * 0.1}s both\`;
        }, 50);
      });
    });
    
    // Search functionality
    function searchParticipants(query) {
      const participants = document.querySelectorAll('.participant-item');
      const searchTerm = query.toLowerCase().trim();
      
      participants.forEach(participant => {
        const name = participant.querySelector('.participant-name').textContent.toLowerCase();
        const isMatch = name.includes(searchTerm);
        participant.style.display = isMatch ? 'flex' : 'none';
      });
      
      // Update visible count
      const visibleCount = document.querySelectorAll('.participant-item[style*="flex"]').length;
      const totalCount = participants.length;
      const header = document.querySelector('.participants-header h2');
      if (searchTerm) {
        header.innerHTML = header.innerHTML.replace(/\\(\\\\d+\\\\)/, \`(\${visibleCount}/\${totalCount})\`);
      } else {
        header.innerHTML = header.innerHTML.replace(/\\(\\\\d+.*?\\\\)/, \`(\${totalCount})\`);
      }
    }
    
    // Smooth scrolling for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      // Ctrl/Cmd + F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchBox = document.querySelector('.search-box');
        if (searchBox) {
          searchBox.focus();
          searchBox.select();
        }
      }
      
      // Escape to clear search
      if (e.key === 'Escape') {
        const searchBox = document.querySelector('.search-box');
        if (searchBox && searchBox === document.activeElement) {
          searchBox.value = '';
          searchParticipants('');
          searchBox.blur();
        }
      }
    });
    
    // Add tooltip functionality
    function addTooltips() {
      const avatars = document.querySelectorAll('.winner-avatar, .participant-avatar');
      avatars.forEach(avatar => {
        avatar.setAttribute('title', avatar.getAttribute('alt') || 'User avatar');
      });
    }
    
    // Initialize tooltips
    addTooltips();
    
    // Add print functionality
    function printTranscript() {
      window.print();
    }
    
    // Add copy functionality for user IDs
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        // Show temporary feedback
        const feedback = document.createElement('div');
        feedback.textContent = 'Copied!';
        feedback.style.cssText = 'position:fixed;top:20px;right:20px;background:#3699c3;color:white;padding:10px 20px;border-radius:5px;z-index:1000;animation:fadeIn 0.3s ease-in-out';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 2000);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      });
    }
    
    // Add click handlers for copying IDs
    document.querySelectorAll('.winner-id, .participant-name').forEach(element => {
      element.addEventListener('click', function(e) {
        if (e.ctrlKey || e.metaKey) {
          const text = this.textContent.replace('ID: ', '').trim();
          copyToClipboard(text);
        }
      });
    });
    
    // Performance optimization: Lazy load images
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });
    
    // Observe all images for lazy loading
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
    
    // Add error handling for images
    document.querySelectorAll('img').forEach(img => {
      img.addEventListener('error', function() {
        this.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
        this.style.opacity = '0.7';
      });
    });
    
    // Add accessibility improvements
    function improveAccessibility() {
      // Add ARIA labels
      document.querySelectorAll('.winner-card').forEach((card, index) => {
        card.setAttribute('aria-label', \`Winner \${index + 1}\`);
      });
      
      document.querySelectorAll('.participant-item').forEach((item, index) => {
        const name = item.querySelector('.participant-name').textContent;
        item.setAttribute('aria-label', \`Participant \${index + 1}: \${name}\`);
      });
      
      // Add keyboard navigation
      const focusableElements = document.querySelectorAll('.winner-card, .participant-item, .search-box');
      focusableElements.forEach((el, index) => {
        el.tabIndex = 0;
        el.addEventListener('keydown', function(e) {
          if (e.key === 'ArrowDown' && index < focusableElements.length - 1) {
            e.preventDefault();
            focusableElements[index + 1].focus();
          }
          if (e.key === 'ArrowUp' && index > 0) {
            e.preventDefault();
            focusableElements[index - 1].focus();
          }
        });
      });
    }
    
    // Initialize accessibility improvements
    improveAccessibility();
    
    // Add animation on scroll
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animation = 'fadeIn 0.6s ease-in-out';
        }
      });
    }, { threshold: 0.1 });
    
    // Observe cards for scroll animations
    document.querySelectorAll('.card').forEach(card => {
      scrollObserver.observe(card);
    });
    
    // Add dark/light mode toggle (future enhancement)
    function toggleTheme() {
      document.body.classList.toggle('light-theme');
      localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    }
    
    // Load saved theme preference
    if (localStorage.getItem('theme') === 'light') {
      document.body.classList.add('light-theme');
    }
    
    console.log('🎁 Giveaway Transcript loaded successfully!');
    console.log('💡 Tips:');
    console.log('• Ctrl/Cmd + F to search participants');
    console.log('• Ctrl/Cmd + Click on names to copy');
    console.log('• Use arrow keys for keyboard navigation');
  `;
}
