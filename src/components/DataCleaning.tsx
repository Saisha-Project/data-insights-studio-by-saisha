import { useState } from 'react';
import { ParsedData, cleanData } from '@/utils/dataParser';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Undo } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DataCleaningProps {
  data: ParsedData;
  onDataCleaned: (data: ParsedData) => void;
}

export const DataCleaning = ({ data, onDataCleaned }: DataCleaningProps) => {
  const [trimWhitespace, setTrimWhitespace] = useState(true);
  const [removeDuplicates, setRemoveDuplicates] = useState(true);
  const [fillMissing, setFillMissing] = useState<'mean' | 'median' | 'mode' | 'remove'>('mean');
  const [dropEmptyColumns, setDropEmptyColumns] = useState(false);
  const { toast } = useToast();

  const handleCleanData = () => {
    const cleanedData = cleanData(data, {
      trimWhitespace,
      removeDuplicates,
      fillMissing,
      dropEmptyColumns,
    });

    toast({
      title: 'Data cleaned successfully',
      description: 'Your data has been processed according to the selected options.',
    });

    onDataCleaned(cleanedData);
  };

  const handleReset = () => {
    onDataCleaned(data);
    toast({
      title: 'Reset to original',
      description: 'Data has been restored to its original state.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Data Cleaning Options
        </CardTitle>
        <CardDescription>
          Configure how you want to clean and prepare your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="trim" className="flex flex-col space-y-1">
              <span>Trim Whitespace</span>
              <span className="font-normal text-sm text-muted-foreground">
                Remove leading/trailing spaces
              </span>
            </Label>
            <Switch
              id="trim"
              checked={trimWhitespace}
              onCheckedChange={setTrimWhitespace}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="duplicates" className="flex flex-col space-y-1">
              <span>Remove Duplicates</span>
              <span className="font-normal text-sm text-muted-foreground">
                Delete duplicate rows
              </span>
            </Label>
            <Switch
              id="duplicates"
              checked={removeDuplicates}
              onCheckedChange={setRemoveDuplicates}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="empty" className="flex flex-col space-y-1">
              <span>Drop Empty Columns</span>
              <span className="font-normal text-sm text-muted-foreground">
                Remove columns with no data
              </span>
            </Label>
            <Switch
              id="empty"
              checked={dropEmptyColumns}
              onCheckedChange={setDropEmptyColumns}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="missing">Handle Missing Values</Label>
            <Select value={fillMissing} onValueChange={(value: any) => setFillMissing(value)}>
              <SelectTrigger id="missing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mean">Fill with Mean</SelectItem>
                <SelectItem value="median">Fill with Median</SelectItem>
                <SelectItem value="mode">Fill with Mode</SelectItem>
                <SelectItem value="remove">Remove Rows</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleCleanData} className="flex-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Clean Data
          </Button>
          <Button onClick={handleReset} variant="outline">
            <Undo className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
