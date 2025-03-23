import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Candidate } from "@shared/schema";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  LabelList,
} from "recharts";

const ResultsTab = () => {
  // Fetch candidates
  const { data: candidates, isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
  });

  // Sort candidates by votes (descending)
  const sortedCandidates = candidates
    ? [...candidates].sort((a, b) => b.votes - a.votes)
    : [];

  // Get the winner (if any votes have been cast)
  const winner = sortedCandidates.length > 0 && sortedCandidates[0].votes > 0
    ? sortedCandidates[0]
    : null;

  // Calculate vote percentages
  const totalVotes = sortedCandidates.reduce((sum, candidate) => sum + candidate.votes, 0);
  
  const candidatesWithPercentage = sortedCandidates.map(candidate => ({
    ...candidate,
    percentage: totalVotes === 0 
      ? 0 
      : parseFloat(((candidate.votes / totalVotes) * 100).toFixed(1))
  }));

  // Prepare chart data
  const chartData = candidatesWithPercentage.map(candidate => ({
    name: candidate.name,
    votes: candidate.votes,
    percentage: candidate.percentage,
    partyName: candidate.partyName
  }));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Election Results</h3>
        <p className="text-neutral-600">Results are updated in real-time as votes are counted.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : totalVotes === 0 ? (
        <Card className="mb-8">
          <CardContent className="p-8 text-center">
            <h4 className="text-lg font-medium mb-2">No Votes Cast Yet</h4>
            <p className="text-neutral-600">
              The election results will be displayed here once voting begins.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Winner Section */}
          {winner && (
            <Card className="mb-8 border-green-200">
              <CardContent className="p-6">
                <h4 className="text-lg font-medium text-green-600 mb-4">Winner</h4>
                <div className="flex items-center">
                  <div className="h-20 w-20 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center mr-4">
                    <img
                      src={winner.partyLogo}
                      alt={`${winner.partyName} logo`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">{winner.name}</h3>
                    <p className="text-lg">{winner.partyName}</p>
                    <p className="text-neutral-600 mt-1">{winner.constituency} Constituency</p>
                    <p className="mt-2">
                      <span className="font-medium text-lg">{winner.votes}</span> votes
                      <span className="text-neutral-600 ml-2">
                        ({candidatesWithPercentage.find(c => c.id === winner.id)?.percentage}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Chart */}
          <div className="mb-8">
            <h4 className="text-lg font-medium mb-4">Vote Distribution</h4>
            <div className="h-80 bg-white p-4 rounded-lg border">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }} 
                    interval={0}
                    tickMargin={10}
                  />
                  <YAxis>
                    <Label
                      value="Votes"
                      angle={-90}
                      position="insideLeft"
                      style={{ textAnchor: 'middle' }}
                    />
                  </YAxis>
                  <Tooltip
                    formatter={(value, name, props) => [
                      value,
                      name === 'votes' ? 'Votes' : '',
                      props
                    ]}
                    labelFormatter={(label) => {
                      const candidate = chartData.find(c => c.name === label);
                      return `${candidate?.name} (${candidate?.partyName})`;
                    }}
                  />
                  <Bar 
                    dataKey="votes" 
                    fill="#1976d2" 
                    name="Votes"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList dataKey="votes" position="top" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Results Leaderboard */}
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-50">
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Constituency</TableHead>
                  <TableHead className="w-24">Votes</TableHead>
                  <TableHead className="w-32">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatesWithPercentage.map((candidate, index) => (
                  <TableRow 
                    key={candidate.id} 
                    className={index === 0 && candidate.votes > 0
                      ? "bg-green-50"
                      : "hover:bg-neutral-50"
                    }
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-neutral-100 flex items-center justify-center mr-2">
                          <img
                            src={candidate.partyLogo}
                            alt={`${candidate.partyName} logo`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <span>{candidate.partyName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{candidate.name}</TableCell>
                    <TableCell>{candidate.constituency}</TableCell>
                    <TableCell className="font-medium">{candidate.votes}</TableCell>
                    <TableCell>{candidate.percentage}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
};

export default ResultsTab;
