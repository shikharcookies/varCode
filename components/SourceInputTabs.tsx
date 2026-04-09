import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import URLInput from './URLInput';
import FileUpload from './FileUpload';
import RawTextInput from './RawTextInput';

type SourceInputTabsProps = {
  onContentExtracted: (content: string) => void;
  disabled?: boolean;
};

export default function SourceInputTabs({
  onContentExtracted,
  disabled = false,
}: SourceInputTabsProps) {
  const [activeTab, setActiveTab] = useState('url');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="url" disabled={disabled}>
          URL
        </TabsTrigger>
        <TabsTrigger value="file" disabled={disabled}>
          Upload File
        </TabsTrigger>
        <TabsTrigger value="text" disabled={disabled}>
          Raw Text
        </TabsTrigger>
      </TabsList>

      <TabsContent value="url">
        <URLInput onContentExtracted={onContentExtracted} disabled={disabled} />
      </TabsContent>

      <TabsContent value="file">
        <FileUpload onContentExtracted={onContentExtracted} disabled={disabled} />
      </TabsContent>

      <TabsContent value="text">
        <RawTextInput onContentExtracted={onContentExtracted} disabled={disabled} />
      </TabsContent>
    </Tabs>
  );
}
