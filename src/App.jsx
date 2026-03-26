
import React, { useState, useEffect } from 'react';

// --- RBAC Configuration ---
const ROLES = {
    ADMIN: 'Admin',
    CONTRIBUTOR: 'Contributor',
    VIEWER: 'Viewer',
};

const permissions = {
    [ROLES.ADMIN]: {
        canCreateDiscussion: true,
        canEditDiscussion: true,
        canDeleteDiscussion: true,
        canApprove: true,
        canManageUsers: true,
    },
    [ROLES.CONTRIBUTOR]: {
        canCreateDiscussion: true,
        canEditDiscussion: false, // Can only edit their own, simplified here
        canDeleteDiscussion: false,
        canApprove: false,
        canManageUsers: false,
    },
    [ROLES.VIEWER]: {
        canCreateDiscussion: false,
        canEditDiscussion: false,
        canDeleteDiscussion: false,
        canApprove: false,
        canManageUsers: false,
    },
};

// --- Mock Data (for demonstration) ---
const currentUser = {
    id: 'user-1',
    name: 'Jane Doe',
    role: ROLES.ADMIN, // Change role here to test RBAC
    avatar: 'JD',
};

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialDiscussions = [
    {
        id: 'disc-1',
        title: 'Q2 Marketing Strategy Review & Feedback',
        author: { id: 'user-2', name: 'John Smith', avatar: 'JS' },
        timestamp: '2023-10-26T10:30:00Z',
        content: 'Our Q2 marketing strategy saw significant engagement. I\'ve uploaded the full report. Please provide your feedback and suggestions for Q3 planning.',
        status: 'In Progress',
        likes: 15,
        comments: 5,
        tags: ['Marketing', 'Strategy', 'Q2', 'Feedback'],
        isHelpful: false,
        milestones: [
            { id: 'm1', name: 'Strategy Document Uploaded', date: '2023-10-25', status: 'completed' },
            { id: 'm2', name: 'Initial Team Review', date: '2023-10-28', status: 'completed' },
            { id: 'm3', name: 'Cross-functional Feedback', date: '2023-11-05', status: 'current', sla: '2023-11-03' }, // SLA breached
            { id: 'm4', name: 'Leadership Approval', date: '2023-11-10', status: 'pending' },
            { id: 'm5', name: 'Final Strategy Publish', date: '2023-11-15', status: 'pending' },
        ],
        auditLogs: [
            { id: 'a1', timestamp: '2023-10-25T10:00:00Z', user: 'John Smith', action: 'created discussion' },
            { id: 'a2', timestamp: '2023-10-26T11:00:00Z', user: 'Jane Doe', action: 'added comment' },
            { id: 'a3', timestamp: '2023-10-28T09:00:00Z', user: 'John Smith', action: 'updated milestone "Initial Team Review" to completed' },
        ],
        commentsData: [
            {
                id: 'comm-1', author: { id: 'user-1', name: 'Jane Doe', avatar: 'JD' }, timestamp: '2023-10-26T11:00:00Z',
                content: 'Great initiative, John! I\'ve reviewed the report. Some clarity needed on KPI definitions for social media campaigns.',
                likes: 3, replies: [],
            },
            {
                id: 'comm-2', author: { id: 'user-3', name: 'Alice Brown', avatar: 'AB' }, timestamp: '2023-10-26T12:15:00Z',
                content: 'Agreed with Jane. Also, could we consider integrating a new sentiment analysis tool for user feedback?',
                likes: 5, replies: [
                    {
                        id: 'comm-3', author: { id: 'user-2', name: 'John Smith', avatar: 'JS' }, timestamp: '2023-10-26T13:00:00Z',
                        content: '@Alice Brown, good point! I\'ll add it to the agenda for the next review session.',
                        likes: 2, replies: [],
                    },
                ],
            },
        ],
    },
    {
        id: 'disc-2',
        title: 'New Feature Request: Enhanced AI Co-pilot for Code Review',
        author: { id: 'user-1', name: 'Jane Doe', avatar: 'JD' },
        timestamp: '2023-10-25T14:00:00Z',
        content: 'Proposing an enhancement to our internal AI Co-pilot to provide more comprehensive code review suggestions and compliance checks. Looking for initial thoughts and feasibility.',
        status: 'Pending',
        likes: 22,
        comments: 8,
        tags: ['AI', 'Development', 'Productivity', 'Feature Request'],
        isHelpful: true,
        milestones: [
            { id: 'm1', name: 'Proposal Drafted', date: '2023-10-24', status: 'completed' },
            { id: 'm2', name: 'Initial Stakeholder Feedback', date: '2023-10-27', status: 'current', sla: '2023-10-30' },
            { id: 'm3', name: 'Technical Feasibility Study', date: '2023-11-03', status: 'pending' },
            { id: 'm4', name: 'Budget Approval', date: '2023-11-10', status: 'pending' },
        ],
        auditLogs: [
            { id: 'a1', timestamp: '2023-10-25T14:00:00Z', user: 'Jane Doe', action: 'created discussion' },
            { id: 'a2', timestamp: '2023-10-25T15:00:00Z', user: 'John Smith', action: 'liked discussion' },
        ],
        commentsData: [],
    },
    {
        id: 'disc-3',
        title: 'HR Policy Update: Remote Work Guidelines v2.0',
        author: { id: 'user-4', name: 'Mark Davis', avatar: 'MD' },
        timestamp: '2023-10-24T09:00:00Z',
        content: 'The updated remote work guidelines (v2.0) are now available for review. Please provide any questions or feedback by end of week.',
        status: 'Approved',
        likes: 10,
        comments: 2,
        tags: ['HR', 'Policy', 'Remote Work'],
        isHelpful: false,
        milestones: [
            { id: 'm1', name: 'Draft Published', date: '2023-10-20', status: 'completed' },
            { id: 'm2', name: 'Legal Review', date: '2023-10-22', status: 'completed' },
            { id: 'm3', name: 'Employee Feedback Period', date: '2023-10-27', status: 'completed' },
            { id: 'm4', name: 'Final Approval', date: '2023-10-28', status: 'completed' },
            { id: 'm5', name: 'Policy Dissemination', date: '2023-10-29', status: 'completed' },
        ],
        auditLogs: [
            { id: 'a1', timestamp: '2023-10-24T09:00:00Z', user: 'Mark Davis', action: 'created discussion' },
        ],
        commentsData: [],
    },
];

const mockActivities = [
    { id: 'act-1', timestamp: '2023-11-01T14:00:00Z', user: 'John Smith', action: 'commented on "Q2 Marketing Strategy Review"' },
    { id: 'act-2', timestamp: '2023-11-01T13:45:00Z', user: 'Jane Doe', action: 'updated status for "New Feature Request" to In Progress' },
    { id: 'act-3', timestamp: '2023-11-01T12:30:00Z', user: 'Alice Brown', action: 'liked a comment in "HR Policy Update"' },
    { id: 'act-4', timestamp: '2023-11-01T11:00:00Z', user: 'John Smith', action: 'created a new discussion "Team Building Event Ideas"' },
];

// --- Helper Components ---

const Icon = ({ name, className = '' }) => <span className={`icon icon-${name} ${className}`} />;

const GlassmorphicCard = ({ children, className = '', ...props }) => (
    <div className={`glassmorphic-card ${className}`} {...props}>
        {children}
    </div>
);

const StatusBadge = ({ status }) => {
    const className = status.toLowerCase().replace(/\s/g, '-');
    let displayStatus = status;
    let icon = 'icon-status-dot'; // Default dot icon

    switch (status) {
        case 'Approved':
            icon = 'icon-check-circle';
            break;
        case 'In Progress':
            icon = 'icon-info-circle';
            break;
        case 'Pending':
            icon = 'icon-warning-circle';
            break;
        case 'Rejected':
            icon = 'icon-times-circle';
            break;
        case 'Exception':
            icon = 'icon-exception-circle';
            break;
        default:
            break;
    }

    return (
        <span className={`status-badge ${className}`}>
            <Icon name={icon} />
            {displayStatus}
        </span>
    );
};

const Breadcrumbs = ({ path, onNavigate }) => (
    <nav className="breadcrumbs" aria-label="breadcrumb">
        {path.map((item, index) => (
            <React.Fragment key={item.id || item.name}>
                {index > 0 && <span className="breadcrumb-separator">/</span>}
                <button
                    onClick={() => onNavigate(item.screen, item.params)}
                    className={`breadcrumb-item ${index === path.length - 1 ? 'active' : ''}`}
                    aria-current={index === path.length - 1 ? 'page' : undefined}
                    style={{ background: 'none', border: 'none', padding: '0', cursor: 'pointer' }}
                >
                    {item.name}
                </button>
            </React.Fragment>
        ))}
    </nav>
);

const MilestoneTracker = ({ milestones }) => {
    const now = new Date();
    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Workflow Progress</h3>
            <div className="milestone-tracker">
                {milestones?.map((milestone, index) => {
                    const milestoneDate = milestone.date ? new Date(milestone.date) : null;
                    const isSlaBreached = milestone.sla && milestoneDate && new Date(milestone.sla) < now && milestone.status !== 'completed';
                    const itemClassName = `milestone-tracker-item ${milestone.status} ${isSlaBreached ? 'sla-breach' : ''}`;
                    return (
                        <div key={milestone.id} className={itemClassName}>
                            {milestone.status !== 'completed' && index < milestones.length -1 && <div className="milestone-line"></div>}
                            <span className="milestone-name">{milestone.name}</span>
                            {milestoneDate && (
                                <span className="milestone-date text-sm ml-auto">
                                    {milestone.status === 'completed' ? 'Completed on' : 'Due by'}: {milestoneDate.toLocaleDateString()}
                                    {isSlaBreached && <span style={{ marginLeft: 'var(--spacing-xs)', fontWeight: 'bold' }}> (SLA Breached)</span>}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ActivityFeed = ({ activities, title = 'Recent Activity' }) => (
    <div style={{ padding: 'var(--spacing-md)' }}>
        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>{title}</h3>
        <div className="activity-feed-list">
            {activities?.map(activity => (
                <div key={activity.id} className="activity-feed-item">
                    <span className="text-sm text-secondary">{new Date(activity.timestamp).toLocaleString()}</span><br/>
                    <strong>{activity.user}</strong> {activity.action}
                </div>
            ))}
        </div>
    </div>
);

const UserAvatar = ({ user }) => (
    <div className="profile-avatar" style={{ fontSize: 'var(--font-size-sm)' }}>
        {user?.avatar || user?.name?.substring(0, 2).toUpperCase()}
    </div>
);

const GlobalSearch = ({ onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        // In a real app, debounce this and pass to onSearch
        onSearch(e.target.value);
    };

    return (
        <div className="global-search-container">
            <input
                type="text"
                placeholder="Global search for discussions, users, tags..."
                className="global-search-input"
                value={searchQuery}
                onChange={handleSearch}
            />
            <Icon name="search" style={{ position: 'absolute', right: 'var(--spacing-md)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        </div>
    );
};

const ReactionButton = ({ iconName, count, active, onClick }) => (
    <button className={`reaction-button ${active ? 'active' : ''}`} onClick={onClick}>
        <Icon name={iconName} className={active ? iconName : ''} />
        {count > 0 && <span>{count}</span>}
    </button>
);

const CommentThread = ({ comment, onReply, level = 0 }) => (
    <div className={`comment-card ${level > 0 ? 'threaded-reply-container' : ''}`} style={{ marginBottom: 'var(--spacing-md)' }}>
        <div className="comment-header">
            <UserAvatar user={comment.author} />
            <span className="comment-author-name">{comment.author.name}</span>
            <span className="comment-timestamp ml-auto">{new Date(comment.timestamp).toLocaleString()}</span>
        </div>
        <div className="comment-body" style={{ color: 'var(--text-main)' }}>
            {comment.content}
        </div>
        <div className="comment-actions">
            <ReactionButton iconName="like" count={comment.likes} active={false} onClick={() => console.log('Like comment', comment.id)} />
            <button className="reaction-button" onClick={() => onReply(comment.id)}>
                <Icon name="reply" /> Reply
            </button>
        </div>
        {comment.replies?.map(reply => (
            <CommentThread key={reply.id} comment={reply} onReply={onReply} level={level + 1} />
        ))}
    </div>
);

// --- Screen Components ---

const DashboardScreen = ({ discussions, activities, currentUserPermissions, handleCardClick, navigateTo }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredDiscussions, setFilteredDiscussions] = useState(discussions);

    useEffect(() => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const filtered = discussions.filter(d =>
            d.title.toLowerCase().includes(lowerCaseSearchTerm) ||
            d.content.toLowerCase().includes(lowerCaseSearchTerm) ||
            d.author.name.toLowerCase().includes(lowerCaseSearchTerm) ||
            d.tags.some(tag => tag.toLowerCase().includes(lowerCaseSearchTerm))
        );
        setFilteredDiscussions(filtered);
    }, [searchTerm, discussions]);

    return (
        <>
            {/* Main Content */}
            <div className="main-content">
                <div className="header-bar">
                    <h2>Community Feed</h2>
                    {currentUserPermissions.canCreateDiscussion && (
                        <button className="btn btn-primary">
                            <Icon name="plus" /> New Discussion
                        </button>
                    )}
                </div>

                <GlobalSearch onSearch={setSearchTerm} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {filteredDiscussions.length === 0 ? (
                        <GlassmorphicCard>
                            <div className="flex flex-col items-center gap-md p-lg">
                                <h3 className="text-secondary">No discussions found.</h3>
                                {currentUserPermissions.canCreateDiscussion && (
                                    <button className="btn btn-primary">
                                        <Icon name="plus" /> Start a New Discussion
                                    </button>
                                )}
                            </div>
                        </GlassmorphicCard>
                    ) : (
                        filteredDiscussions.map((discussion) => (
                            <GlassmorphicCard
                                key={discussion.id}
                                className="card"
                                onClick={() => handleCardClick('DISCUSSION_DETAIL', { discussionId: discussion.id })}
                            >
                                <div className={`card-status ${discussion.status.toLowerCase().replace(/\s/g, '-')}`}>
                                    <div className="discussion-card-header">
                                        <h3 style={{ margin: '0', color: 'var(--text-main)' }}>{discussion.title}</h3>
                                        <StatusBadge status={discussion.status} />
                                    </div>
                                    <div className="discussion-card-meta">
                                        <UserAvatar user={discussion.author} />
                                        <span>{discussion.author.name}</span>
                                        <Icon name="clock" />
                                        <span>{new Date(discussion.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)' }}>{discussion.content.substring(0, 120)}...</p>
                                    <div className="tag-list">
                                        {discussion.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                                    </div>
                                    <div className="discussion-card-actions">
                                        <ReactionButton iconName="comment" count={discussion.comments} active={false} />
                                        <ReactionButton iconName="like" count={discussion.likes} active={false} />
                                        {discussion.isHelpful && (
                                            <ReactionButton iconName="helpful" count={1} active={true} />
                                        )}
                                        {currentUserPermissions.canEditDiscussion && currentUser.id === discussion.author.id && (
                                            <button className="btn-icon" onClick={(e) => { e.stopPropagation(); console.log('Edit discussion', discussion.id); }}>
                                                <Icon name="edit" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </GlassmorphicCard>
                        ))
                    )}
                </div>
            </div>

            {/* Right Contextual Panel */}
            <div className="panel-right">
                <GlassmorphicCard>
                    <ActivityFeed activities={mockActivities} title="Live Activity Feed" />
                    <div className="ai-suggestions-panel">
                        <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>AI-Powered Suggestions</h4>
                        <div className="ai-suggestion-item">"Review pending approvals"</div>
                        <div className="ai-suggestion-item">"Follow up on Q2 Marketing Strategy"</div>
                        <div className="ai-suggestion-item">"Discussions trending in #AI"</div>
                    </div>
                </GlassmorphicCard>
            </div>
        </>
    );
};

const DiscussionDetailScreen = ({ discussionId, discussions, currentUserPermissions, navigateTo }) => {
    const discussion = discussions.find(d => d.id === discussionId);
    const [newComment, setNewComment] = useState('');
    const [replyingToCommentId, setReplyingToCommentId] = useState(null);

    if (!discussion) {
        return <div className="discussion-detail-screen">Discussion not found.</div>;
    }

    const breadcrumbPath = [
        { name: 'Dashboard', screen: 'DASHBOARD', params: {} },
        { name: discussion.title, screen: 'DISCUSSION_DETAIL', params: { discussionId } },
    ];

    const handleAddComment = () => {
        if (!newComment.trim()) return;

        const newCommentObj = {
            id: generateId(),
            author: currentUser,
            timestamp: new Date().toISOString(),
            content: newComment,
            likes: 0,
            replies: [],
        };

        const updateComments = (comments) => {
            if (replyingToCommentId) {
                return comments.map(c => {
                    if (c.id === replyingToCommentId) {
                        return {
                            ...c,
                            replies: [...(c.replies || []), newCommentObj],
                        };
                    }
                    return { ...c, replies: updateComments(c.replies || []) };
                });
            }
            return [...comments, newCommentObj];
        };

        const updatedDiscussions = discussions.map(d =>
            d.id === discussionId
                ? {
                    ...d,
                    comments: d.comments + 1,
                    commentsData: updateComments(d.commentsData || []),
                    auditLogs: [...(d.auditLogs || []), { id: generateId(), timestamp: new Date().toISOString(), user: currentUser.name, action: `added ${replyingToCommentId ? 'a reply' : 'a comment'}` }]
                }
                : d
        );

        // This is a simplified state update. In a real app, this would dispatch to a global state or API.
        // For this example, we're just pretending `discussions` state is updated.
        // In the App component, the main `discussions` state would need to be updated.
        // For demonstration purposes, we'll use a local 'discussion' object here that would reflect the global state.
        // setDiscussions(updatedDiscussions); // Would be called from parent App component.

        console.log('Updated Discussion with comment:', updatedDiscussions.find(d => d.id === discussionId));
        setNewComment('');
        setReplyingToCommentId(null);
    };

    const handleReplyClick = (commentId) => {
        setReplyingToCommentId(commentId);
        setNewComment(`@${discussion?.commentsData?.find(c => c.id === commentId)?.author?.name || ''} `);
        // Focus the textarea
        document.getElementById('comment-textarea')?.focus();
    };

    return (
        <div className="discussion-detail-screen">
            <Breadcrumbs path={breadcrumbPath} onNavigate={navigateTo} />

            <div className="header-bar" style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ maxWidth: '70%' }}>
                    <h1 className="discussion-title">{discussion.title}</h1>
                    <div className="discussion-metadata">
                        <span><UserAvatar user={discussion.author} /> {discussion.author.name}</span>
                        <span><Icon name="clock" /> {new Date(discussion.timestamp).toLocaleString()}</span>
                        <StatusBadge status={discussion.status} />
                    </div>
                </div>
                <div className="flex gap-md">
                    {currentUserPermissions.canEditDiscussion && currentUser.id === discussion.author.id && (
                        <button className="btn btn-secondary">
                            <Icon name="edit" /> Edit Discussion
                        </button>
                    )}
                    <button className="btn btn-secondary">
                        <Icon name="pin" /> Pin
                    </button>
                    <button className="btn btn-secondary">
                        <Icon name="bookmark" /> Bookmark
                    </button>
                    <button className="btn btn-primary">
                        <Icon name="share" /> Share
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--spacing-xl)' }}>
                <div>
                    <div className="discussion-content">
                        <p>{discussion.content}</p>
                        <div className="tag-list" style={{ marginTop: 'var(--spacing-md)' }}>
                            {discussion.tags.map(tag => <span key={tag} className="tag">#{tag}</span>)}
                        </div>
                    </div>

                    <div className="comments-section">
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Comments ({discussion.comments})</h2>
                        <div className="comment-input-area">
                            <UserAvatar user={currentUser} />
                            <textarea
                                id="comment-textarea"
                                placeholder={replyingToCommentId ? 'Write a reply...' : 'Write a comment...'}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                            ></textarea>
                            <button className="btn btn-primary" onClick={handleAddComment}>
                                Post
                            </button>
                        </div>
                        <div className="comments-list">
                            {discussion.commentsData?.map(comment => (
                                <CommentThread key={comment.id} comment={comment} onReply={handleReplyClick} />
                            ))}
                        </div>
                    </div>
                </div>
                <GlassmorphicCard>
                    <MilestoneTracker milestones={discussion.milestones} />
                    <hr style={{ borderTop: '1px solid var(--border-light)', margin: 'var(--spacing-md) 0' }} />
                    <ActivityFeed activities={discussion.auditLogs} title="Audit Log" />
                </GlassmorphicCard>
            </div>
        </div>
    );
};

const App = () => {
    // Centralized routing state
    const [view, setView] = useState({ screen: 'DASHBOARD', params: {} });
    // State for mock discussions, allowing updates if needed (though not fully implemented for comments)
    const [discussions, setDiscussions] = useState(initialDiscussions);

    const navigateTo = (screen, params = {}) => {
        setView((prevView) => {
            // Functional update
            return { screen, params };
        });
    };

    const handleCardClick = (screen, params) => {
        navigateTo(screen, params);
    };

    const currentUserPermissions = permissions[currentUser.role] || {};

    const renderScreen = () => {
        switch (view.screen) {
            case 'DASHBOARD':
                return (
                    <div className="app-container">
                        {/* Left Navigation Panel */}
                        <GlassmorphicCard className="nav-left">
                            <div className="navbar-top">
                                <div className="logo">Interacta</div>
                                <div className="flex gap-sm items-center">
                                    <button className="btn-icon notification-bell">
                                        <Icon name="bell" style={{ fontSize: 'var(--font-size-lg)' }} />
                                        <span className="notification-badge">3</span>
                                    </button>
                                    <UserAvatar user={currentUser} />
                                </div>
                            </div>
                            <nav className="nav-links" style={{ marginTop: 'var(--spacing-md)' }}>
                                <button className="active" onClick={() => navigateTo('DASHBOARD')}>
                                    <Icon name="dashboard" className="nav-icon" /> Dashboard
                                </button>
                                <button onClick={() => console.log('Navigate to Community')}>
                                    <Icon name="community" className="nav-icon" /> Community Spaces
                                </button>
                                <button onClick={() => console.log('Navigate to Insights')}>
                                    <Icon name="insights" className="nav-icon" /> Insights
                                </button>
                                <button onClick={() => console.log('Navigate to Settings')}>
                                    <Icon name="settings" className="nav-icon" /> Settings
                                </button>
                            </nav>
                            {currentUserPermissions.canManageUsers && (
                                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-light)', paddingTop: 'var(--spacing-md)' }}>
                                    <button onClick={() => console.log('Navigate to Admin Tools')} style={{ color: 'var(--text-secondary)' }}>
                                        <Icon name="settings" className="nav-icon" /> Admin Tools
                                    </button>
                                </div>
                            )}
                        </GlassmorphicCard>
                        <DashboardScreen
                            discussions={discussions}
                            activities={mockActivities}
                            currentUserPermissions={currentUserPermissions}
                            handleCardClick={handleCardClick}
                            navigateTo={navigateTo}
                        />
                    </div>
                );
            case 'DISCUSSION_DETAIL':
                return (
                    <DiscussionDetailScreen
                        discussionId={view.params.discussionId}
                        discussions={discussions}
                        currentUserPermissions={currentUserPermissions}
                        navigateTo={navigateTo}
                    />
                );
            default:
                return (
                    <div style={{ padding: 'var(--spacing-md)' }}>
                        <h1>404: Screen Not Found</h1>
                        <button onClick={() => navigateTo('DASHBOARD')}>Go to Dashboard</button>
                    </div>
                );
        }
    };

    return (
        <div className="App">
            {renderScreen()}
        </div>
    );
};

export default App;